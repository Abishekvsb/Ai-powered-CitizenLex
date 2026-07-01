package com.citizenlex.controllers;

import com.citizenlex.entities.*;
import com.citizenlex.repositories.CityRepository;
import com.citizenlex.repositories.SpecializationRepository;
import com.citizenlex.repositories.UserRepository;
import com.citizenlex.repositories.RoleRepository;
import com.citizenlex.config.DatabaseSeeder;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.LawyerService;
import com.citizenlex.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lawyers")
public class LawyerController {

    @Autowired
    private LawyerService lawyerService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SpecializationRepository specializationRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private com.citizenlex.services.CloudinaryService cloudinaryService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DatabaseSeeder databaseSeeder;

    /**
     * POST /api/lawyers/upload-document — Upload verification document to Cloudinary.
     */
    @PostMapping("/upload-document")
    public ResponseEntity<?> uploadVerificationDoc(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("type") String type) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            Map<String, String> uploadResult = cloudinaryService.uploadDocument(file, principal.getId(), type);
            return ResponseEntity.ok(uploadResult);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/lawyers — List verified lawyers with advanced filters.
     */
    @GetMapping
    public ResponseEntity<List<Lawyer>> getLawyers(
            @RequestParam(required = false) Long specializationId,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Double maxFee,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "id_desc") String sortBy) {

        List<Lawyer> list = lawyerService.getFilteredLawyers(
                specializationId, cityId, language, minExperience, maxFee, minRating, search, sortBy);
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/lawyers/{id} — Get lawyer profile details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getLawyerById(@PathVariable Long id) {
        Optional<Lawyer> lawyer = lawyerService.getLawyerById(id);
        if (lawyer.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Lawyer not found."));
        }
        return ResponseEntity.ok(lawyer.get());
    }

    /**
     * GET /api/lawyers/me — Get authenticated lawyer's own profile.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyLawyerProfile() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());
        Optional<Lawyer> lawyer = lawyerService.getLawyerByUser(user);
        if (lawyer.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Lawyer profile not found."));
        }
        return ResponseEntity.ok(lawyer.get());
    }

    /**
     * POST /api/lawyers/register — Register authenticated user as a lawyer.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerLawyer(@RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            String advocateId = (String) req.get("advocateId");
            Long specializationId = Long.valueOf(req.get("specializationId").toString());
            Integer experienceYears = Integer.valueOf(req.get("experienceYears").toString());
            Double fee = Double.valueOf(req.get("consultationFee").toString());
            String courtName = (String) req.get("courtName");
            Long cityId = Long.valueOf(req.get("cityId").toString());
            String bio = (String) req.get("bio");
            String languages = (String) req.get("languages");
            String qualifications = (String) req.get("qualifications");
            String achievements = (String) req.get("achievements");
            String barId = (String) req.get("barCouncilIdUrl");
            String cert = (String) req.get("licenseCertificateUrl");
            String govId = (String) req.get("govIdUrl");

            Lawyer lawyer = lawyerService.registerLawyer(
                    user, advocateId, specializationId, experienceYears, fee, courtName, cityId,
                    bio, languages, qualifications, achievements, barId, cert, govId
            );
            return ResponseEntity.ok(lawyer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/lawyers/{id}/reviews — Leave a review (only allowed if consultation completed).
     */
    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            Integer rating = Integer.valueOf(req.get("rating").toString());
            String comment = (String) req.get("comment");
            Review review = lawyerService.addReview(user, id, rating, comment);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/lawyers/reviews/{reviewId}/vote — Vote review helpfulness.
     */
    @PostMapping("/reviews/{reviewId}/vote")
    public ResponseEntity<?> voteReview(@PathVariable Long reviewId, @RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            Boolean isUpvote = (Boolean) req.get("isUpvote");
            lawyerService.voteReview(user, reviewId, isUpvote);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/lawyers/recommend — AI lawyer recommendations engine.
     */
    @GetMapping("/recommend")
    public ResponseEntity<List<Lawyer>> recommendLawyers(@RequestParam String query) {
        List<Lawyer> recommendations = lawyerService.recommendLawyers(query);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/specializations")
    public ResponseEntity<List<Specialization>> getSpecializations() {
        return ResponseEntity.ok(specializationRepository.findAll());
    }

    @GetMapping("/cities")
    public ResponseEntity<List<City>> getCities() {
        return ResponseEntity.ok(cityRepository.findAll());
    }

    // --- Admin Lawyer Approvals ---
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Lawyer>> adminGetAllLawyers() {
        return ResponseEntity.ok(lawyerService.getFilteredLawyers(null, null, null, null, null, null, null, "id_desc"));
    }

    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveLawyer(@PathVariable Long id) {
        try {
            lawyerService.approveLawyer(id);
            return ResponseEntity.ok(Map.of("message", "Lawyer approved successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectLawyer(@PathVariable Long id) {
        try {
            lawyerService.rejectLawyer(id);
            return ResponseEntity.ok(Map.of("message", "Lawyer rejected successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> suspendLawyer(@PathVariable Long id) {
        try {
            lawyerService.suspendLawyer(id);
            return ResponseEntity.ok(Map.of("message", "Lawyer suspended successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/lawyers/seed — Seed 10 verified lawyers for testing (admin or dev mode).
     */
    @PostMapping("/seed")
    public ResponseEntity<?> seedDemoLawyers() {
        boolean isDev = databaseSeeder.isDevelopmentMode();
        boolean isAdmin = false;
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal != null) {
            isAdmin = principal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        }

        if (!isDev && !isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Seeding is disabled in production for non-admin users."));
        }

        try {
            Role lawyerRole = roleRepository.findByName("ROLE_LAWYER")
                    .orElseGet(() -> roleRepository.save(new Role("ROLE_LAWYER")));

            databaseSeeder.seedSpecializationsAndCitiesIfEmpty();
            long seededCount = databaseSeeder.seedMockLawyersList(lawyerRole);
            return ResponseEntity.ok(Map.of("success", true, "message", "Seeded " + seededCount + " demo lawyers successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UserPrincipal getAuthenticatedPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return (UserPrincipal) auth.getPrincipal();
    }
}
