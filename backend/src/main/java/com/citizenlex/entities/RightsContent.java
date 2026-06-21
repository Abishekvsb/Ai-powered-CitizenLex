package com.citizenlex.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "rights_content")
public class RightsContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private RightsCategory category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "tamil_title", length = 200)
    private String tamilTitle;

    @Column(name = "tamil_content", columnDefinition = "TEXT")
    private String tamilContent;

    @Column(columnDefinition = "TEXT")
    private String resources;

    public RightsContent() {}

    public RightsContent(RightsCategory category, String title, String content, String tamilTitle, String tamilContent, String resources) {
        this.category = category;
        this.title = title;
        this.content = content;
        this.tamilTitle = tamilTitle;
        this.tamilContent = tamilContent;
        this.resources = resources;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RightsCategory getCategory() {
        return category;
    }

    public void setCategory(RightsCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTamilTitle() {
        return tamilTitle;
    }

    public void setTamilTitle(String tamilTitle) {
        this.tamilTitle = tamilTitle;
    }

    public String getTamilContent() {
        return tamilContent;
    }

    public void setTamilContent(String tamilContent) {
        this.tamilContent = tamilContent;
    }

    public String getResources() {
        return resources;
    }

    public void setResources(String resources) {
        this.resources = resources;
    }
}
