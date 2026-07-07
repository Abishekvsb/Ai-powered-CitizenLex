package com.citizenlex.utils;

import org.apache.poi.xwpf.usermodel.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class DocumentGeneratorUtil {

    public static byte[] generateDocx(String type, String content) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {
            // Document Title
            XWPFParagraph titlePara = document.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText(type.toUpperCase());
            titleRun.setBold(true);
            titleRun.setFontSize(16);
            titleRun.setFontFamily("Arial");
            titleRun.addBreak();

            // Document body
            String[] lines = content.split("\n");
            for (String line : lines) {
                XWPFParagraph paragraph = document.createParagraph();
                XWPFRun run = paragraph.createRun();
                run.setText(line);
                run.setFontSize(11);
                run.setFontFamily("Arial");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);
            return out.toByteArray();
        }
    }

    public static byte[] generatePdf(String type, String content) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            
            PDPageContentStream contentStream = new PDPageContentStream(doc, page);
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
            contentStream.setLeading(16f);
            contentStream.beginText();
            contentStream.newLineAtOffset(50, 750);
            
            contentStream.showText(type.toUpperCase());
            contentStream.newLine();
            contentStream.newLine();
            
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.setLeading(14f);
            
            String[] paragraphs = content.split("\n");
            float y = 718;
            for (String p : paragraphs) {
                if (p.trim().isEmpty()) {
                    contentStream.newLine();
                    y -= 14;
                    continue;
                }
                
                // Wrap text to avoid overflow (approx 80 chars max per line)
                List<String> lines = wrapText(p, 80);
                for (String line : lines) {
                    if (y < 50) {
                        contentStream.endText();
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        contentStream = new PDPageContentStream(doc, page);
                        contentStream.setFont(PDType1Font.HELVETICA, 10);
                        contentStream.setLeading(14f);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(50, 750);
                        y = 750;
                    }
                    // Strip out non-ASCII characters since standard Helvetica doesn't support them
                    String cleanLine = line.replaceAll("[^\\x00-\\x7F]", "?");
                    contentStream.showText(cleanLine);
                    contentStream.newLine();
                    y -= 14;
                }
            }
            contentStream.endText();
            contentStream.close();
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
    
    private static List<String> wrapText(String text, int limit) {
        List<String> list = new ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        for (String w : words) {
            if (line.length() + w.length() + 1 > limit) {
                list.add(line.toString());
                line = new StringBuilder(w);
            } else {
                if (line.length() > 0) line.append(" ");
                line.append(w);
            }
        }
        if (line.length() > 0) {
            list.add(line.toString());
        }
        return list;
    }
}
