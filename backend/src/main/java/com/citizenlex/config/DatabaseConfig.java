package com.citizenlex.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String defaultUrl;

    @Value("${spring.datasource.username}")
    private String defaultUsername;

    @Value("${spring.datasource.password}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = defaultUrl;
        String username = defaultUsername;
        String password = defaultPassword;
        String driverClassName = "org.postgresql.Driver";

        // Check if Railway MYSQL_URL or MYSQL_PRIVATE_URL is present
        String rawUrl = System.getenv("MYSQL_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("MYSQL_PRIVATE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }

        if (rawUrl != null && !rawUrl.isBlank()) {
            if (rawUrl.startsWith("mysql://")) {
                try {
                    logger.info("Detected MySQL database connection URL. Parsing parameters...");
                    URI uri = new URI(rawUrl);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] userParts = userInfo.split(":");
                        username = userParts[0];
                        password = userParts[1];
                    }

                    String host = uri.getHost();
                    int port = uri.getPort();
                    if (port == -1) {
                        port = 3306;
                    }
                    String path = uri.getPath();
                    if (path.startsWith("/")) {
                        path = path.substring(1);
                    }

                    // Construct standard JDBC connection url
                    url = "jdbc:mysql://" + host + ":" + port + "/" + path + "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true";
                    driverClassName = "com.mysql.cj.jdbc.Driver";
                    logger.info("Successfully parsed MySQL database target. Target JDBC URL: jdbc:mysql://{}:{}/{}", host, port, path);
                } catch (Exception e) {
                    logger.error("Failed to parse MySQL connection URL: {}", rawUrl, e);
                }
            } else if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
                try {
                    logger.info("Detected PostgreSQL database connection URL. Parsing parameters...");
                    URI uri = new URI(rawUrl);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] userParts = userInfo.split(":");
                        username = userParts[0];
                        password = userParts[1];
                    }

                    String host = uri.getHost();
                    int port = uri.getPort();
                    if (port == -1) {
                        port = 5432;
                    }
                    String path = uri.getPath();
                    if (path.startsWith("/")) {
                        path = path.substring(1);
                    }

                    // Construct standard JDBC connection url
                    url = "jdbc:postgresql://" + host + ":" + port + "/" + path;
                    driverClassName = "org.postgresql.Driver";
                    logger.info("Successfully parsed PostgreSQL database target. Target JDBC URL: jdbc:postgresql://{}:{}/{}", host, port, path);
                } catch (Exception e) {
                    logger.error("Failed to parse PostgreSQL connection URL: {}", rawUrl, e);
                }
            }
        } else {
            if (url != null && url.startsWith("jdbc:mysql:")) {
                driverClassName = "com.mysql.cj.jdbc.Driver";
            }
            logger.info("Using standard JDBC parameters. Connection Target URL: {}, Driver: {}", url, driverClassName);
        }

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }
}
