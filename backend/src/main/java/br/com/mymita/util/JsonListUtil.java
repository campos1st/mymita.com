package br.com.mymita.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

public final class JsonListUtil {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonListUtil() {}

    public static List<String> parseList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static String toJson(List<String> list) {
        if (list == null) return "[]";
        try {
            List<String> cleaned = list.stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(s -> s.trim().toLowerCase())
                    .distinct()
                    .toList();
            return MAPPER.writeValueAsString(cleaned);
        } catch (Exception e) {
            return "[]";
        }
    }

    public static String sanitizeText(String value) {
        if (value == null) return null;
        return value.replaceAll("<[^>]*>", "").trim();
    }
}
