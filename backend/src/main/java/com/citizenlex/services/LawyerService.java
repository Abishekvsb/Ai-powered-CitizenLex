package com.citizenlex.services;

import com.citizenlex.entities.*;
import com.citizenlex.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LawyerService {

    @Autowired
    private LawyerRepository lawyerRepository;

    @Autowired
    private SpecializationRepository specializationRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReviewVoteRepository reviewVoteRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    @Transactional
    public Lawyer registerLawyer(User user, String advocateId, Long specializationId, Integer experienceYears,
                                 Double fee, String courtName, Long cityId, String bio, String languages,
                                 String qualifications, String achievements, String barCouncilIdUrl,
                                 String licenseCertificateUrl, String govIdUrl, String officeAddress,
                                 String district, String state, String pincode, String workingHours,
                                 Double latitude, Double longitude) {

        Optional<Lawyer> existing = lawyerRepository.findByUser(user);
        if (existing.isPresent()) {
            throw new RuntimeException("User is already registered as a lawyer.");
        }

        Specialization spec = specializationRepository.findById(specializationId)
                .orElseThrow(() -> new RuntimeException("Specialization not found."));

        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new RuntimeException("City not found."));

        Lawyer lawyer = new Lawyer();
        lawyer.setUser(user);
        lawyer.setAdvocateId(advocateId);
        lawyer.setSpecialization(spec);
        lawyer.setExperienceYears(experienceYears);
        lawyer.setConsultationFee(fee);
        lawyer.setCourtName(courtName);
        lawyer.setCity(city);
        lawyer.setBio(bio);
        lawyer.setLanguages(languages);
        lawyer.setQualifications(qualifications);
        lawyer.setAchievements(achievements);
        lawyer.setBarCouncilIdUrl(barCouncilIdUrl);
        lawyer.setLicenseCertificateUrl(licenseCertificateUrl);
        lawyer.setGovIdUrl(govIdUrl);
        lawyer.setOfficeAddress(officeAddress);
        lawyer.setDistrict(district);
        lawyer.setState(state);
        lawyer.setPincode(pincode);
        lawyer.setWorkingHours(workingHours != null && !workingHours.isEmpty() ? workingHours : "09:00 - 18:00");
        lawyer.setIsDemo(false);

        if (latitude == null || longitude == null) {
            double[] coords = geocodeAddress(officeAddress, district, state);
            lawyer.setLatitude(coords[0]);
            lawyer.setLongitude(coords[1]);
        } else {
            lawyer.setLatitude(latitude);
            lawyer.setLongitude(longitude);
        }

        // Assign ROLE_LAWYER to user
        Optional<Role> lawyerRole = roleRepository.findByName("ROLE_LAWYER");
        if (lawyerRole.isPresent()) {
            user.getRoles().add(lawyerRole.get());
            userRepository.save(user);
        }

        return lawyerRepository.save(lawyer);
    }

    public double[] geocodeAddress(String officeAddress, String district, String state) {
        String apiKey = System.getenv("GOOGLE_MAPS_API_KEY");
        if (apiKey == null || apiKey.isEmpty()) {
            apiKey = System.getenv("VITE_GOOGLE_MAPS_API_KEY");
        }
        
        if (apiKey != null && !apiKey.isEmpty() && !"mock".equalsIgnoreCase(apiKey)) {
            try {
                String addressQuery = (officeAddress != null ? officeAddress : "") + ", " + 
                                       (district != null ? district : "") + ", " + 
                                       (state != null ? state : "");
                String encodedAddress = java.net.URLEncoder.encode(addressQuery, "UTF-8");
                String urlString = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodedAddress + "&key=" + apiKey;
                
                java.net.URL url = new java.net.URL(urlString);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    
                    String json = response.toString();
                    if (json.contains("\"location\"")) {
                        int locationIndex = json.indexOf("\"location\"");
                        int latIndex = json.indexOf("\"lat\"", locationIndex);
                        int lngIndex = json.indexOf("\"lng\"", locationIndex);
                        
                        if (latIndex != -1 && lngIndex != -1) {
                            int latStart = json.indexOf(":", latIndex) + 1;
                            int latEnd = json.indexOf(",", latStart);
                            double lat = Double.parseDouble(json.substring(latStart, latEnd).trim());
                            
                            int lngStart = json.indexOf(":", lngIndex) + 1;
                            int lngEnd = json.indexOf("}", lngStart);
                            int commaIndex = json.indexOf(",", lngStart);
                            if (commaIndex != -1 && commaIndex < lngEnd) {
                                lngEnd = commaIndex;
                            }
                            double lng = Double.parseDouble(json.substring(lngStart, lngEnd).trim());
                            
                            return new double[]{lat, lng};
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Google Geocoding API failed: " + e.getMessage());
            }
        }
        
        double[] center = getDistrictCenter(district);
        double noiseLat = (Math.random() - 0.5) * 0.015;
        double noiseLng = (Math.random() - 0.5) * 0.015;
        return new double[]{center[0] + noiseLat, center[1] + noiseLng};
    }

    private double[] getDistrictCenter(String district) {
        if (district == null) return new double[]{13.0827, 80.2707};
        
        String d = district.trim().toLowerCase();
        switch (d) {
            case "ariyalur": return new double[]{11.1401, 79.0747};
            case "chengalpattu": return new double[]{12.6917, 79.9750};
            case "chennai": return new double[]{13.0827, 80.2707};
            case "coimbatore": return new double[]{11.0168, 76.9558};
            case "cuddalore": return new double[]{11.7480, 79.7714};
            case "dharmapuri": return new double[]{12.1353, 78.1560};
            case "dindigul": return new double[]{10.3673, 77.9803};
            case "erode": return new double[]{11.3410, 77.7172};
            case "kallakurichi": return new double[]{11.7384, 78.9639};
            case "kanchipuram": return new double[]{12.8387, 79.7016};
            case "kanyakumari": return new double[]{8.0883, 77.5385};
            case "karur": return new double[]{10.9601, 78.0766};
            case "krishnagiri": return new double[]{12.5186, 78.2137};
            case "madurai": return new double[]{9.9252, 78.1198};
            case "mayiladuthurai": return new double[]{11.1018, 79.6522};
            case "nagapattinam": return new double[]{10.7656, 79.8433};
            case "namakkal": return new double[]{11.2189, 78.1673};
            case "nilgiris": return new double[]{11.4102, 76.6950};
            case "perambalur": return new double[]{11.2342, 78.8797};
            case "pudukkottai": return new double[]{10.3797, 78.8202};
            case "ramanathapuram": return new double[]{9.3639, 78.8394};
            case "ranipet": return new double[]{12.9274, 79.3327};
            case "salem": return new double[]{11.6643, 78.1460};
            case "sivaganga":
            case "sivagangai": return new double[]{9.8433, 78.4833};
            case "tenkasi": return new double[]{8.9593, 77.3142};
            case "thanjavur": return new double[]{10.7870, 79.1378};
            case "theni": return new double[]{10.0104, 77.4777};
            case "thoothukudi": return new double[]{8.7642, 78.1348};
            case "tiruchirappalli": return new double[]{10.7905, 78.7047};
            case "tirunelveli": return new double[]{8.7139, 77.7567};
            case "tirupathur": return new double[]{12.4929, 78.5678};
            case "tiruppur": return new double[]{11.1085, 77.3411};
            case "tiruvallur": return new double[]{13.1438, 79.9077};
            case "tiruvannamalai": return new double[]{12.2280, 79.0665};
            case "tiruvarur": return new double[]{10.7722, 79.6361};
            case "vellore": return new double[]{12.9165, 79.1325};
            case "viluppuram": return new double[]{11.9401, 79.4861};
            case "virudhunagar": return new double[]{9.5680, 77.9624};
            default: return new double[]{13.0827, 80.2707};
        }
    }

    public List<Lawyer> getFilteredLawyers(Long specializationId, Long cityId, String language,
                                           Integer minExperience, Double maxFee, Double minRating,
                                           String searchQuery, String sortBy, String state, String district,
                                           String city, Boolean isOnline) {

        return lawyerRepository.findAll((Specification<Lawyer>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only return approved/verified lawyers in public searches
            predicates.add(cb.equal(root.get("verificationStatus"), "APPROVED"));

            if (specializationId != null) {
                predicates.add(cb.equal(root.get("specialization").get("id"), specializationId));
            }
            if (cityId != null) {
                predicates.add(cb.equal(root.get("city").get("id"), cityId));
            }
            if (language != null && !language.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("languages")), "%" + language.toLowerCase() + "%"));
            }
            if (minExperience != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("experienceYears"), minExperience));
            }
            if (maxFee != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("consultationFee"), maxFee));
            }
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }
            if (state != null && !state.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("state")), "%" + state.toLowerCase() + "%"));
            }
            if (district != null && !district.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("district")), "%" + district.toLowerCase() + "%"));
            }
            if (city != null && !city.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("city").get("name")), "%" + city.toLowerCase() + "%"));
            }
            if (isOnline != null) {
                predicates.add(cb.equal(root.get("isOnline"), isOnline));
            }
            if (searchQuery != null && !searchQuery.isEmpty()) {
                String pattern = "%" + searchQuery.toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("user").get("firstName")), pattern);
                Predicate lastNameMatch = cb.like(cb.lower(root.get("user").get("lastName")), pattern);
                Predicate bioMatch = cb.like(cb.lower(root.get("bio")), pattern);
                Predicate courtMatch = cb.like(cb.lower(root.get("courtName")), pattern);
                Predicate specMatch = cb.like(cb.lower(root.get("specialization").get("name")), pattern);
                Predicate cityMatch = cb.like(cb.lower(root.get("city").get("name")), pattern);
                Predicate districtMatch = cb.like(cb.lower(root.get("district")), pattern);
                predicates.add(cb.or(nameMatch, lastNameMatch, bioMatch, courtMatch, specMatch, cityMatch, districtMatch));
            }

            if ("fee_asc".equals(sortBy)) {
                query.orderBy(cb.asc(root.get("consultationFee")));
            } else if ("experience_desc".equals(sortBy)) {
                query.orderBy(cb.desc(root.get("experienceYears")));
            } else if ("rating_desc".equals(sortBy)) {
                query.orderBy(cb.desc(root.get("rating")));
            } else {
                query.orderBy(cb.desc(root.get("id")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        });
    }

    public Optional<Lawyer> getLawyerById(Long id) {
        return lawyerRepository.findById(id);
    }

    public Optional<Lawyer> getLawyerByUser(User user) {
        return lawyerRepository.findByUser(user);
    }

    @Transactional
    public Review addReview(User user, Long lawyerId, Integer rating, String comment) {
        Lawyer lawyer = lawyerRepository.findById(lawyerId)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));

        // Only allow review if consultation is completed
        long completedConsultations = appointmentRepository.countByUserAndLawyerAndStatus(user, lawyer, "COMPLETED");
        if (completedConsultations == 0) {
            throw new RuntimeException("You can only review a lawyer after completing a consultation.");
        }

        Optional<Review> existing = reviewRepository.findByUserAndLawyer(user, lawyer);
        Review review = existing.orElseGet(Review::new);
        review.setUser(user);
        review.setLawyer(lawyer);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now());
        reviewRepository.save(review);

        recalculateLawyerRating(lawyer);

        // Notify lawyer
        Notification notif = new Notification();
        notif.setUser(lawyer.getUser());
        notif.setTitle("New Review Received");
        notif.setMessage(user.getFirstName() + " left a " + rating + "-star review on your profile.");
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);

        return review;
    }

    @Transactional
    public void deleteReview(User user, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found."));
        if (!review.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied.");
        }

        Lawyer lawyer = review.getLawyer();
        reviewRepository.delete(review);
        recalculateLawyerRating(lawyer);
    }

    @Transactional
    public void voteReview(User user, Long reviewId, Boolean isUpvote) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found."));

        Optional<ReviewVote> existing = reviewVoteRepository.findByUserAndReview(user, review);
        if (existing.isPresent()) {
            ReviewVote vote = existing.get();
            vote.setIsUpvote(isUpvote);
            reviewVoteRepository.save(vote);
        } else {
            ReviewVote vote = new ReviewVote(user, review, isUpvote);
            reviewVoteRepository.save(vote);
        }

        // Recalculate helpful votes
        long upvotes = reviewVoteRepository.countByReviewAndIsUpvote(review, true);
        review.setHelpfulVotes((int) upvotes);
        reviewRepository.save(review);
    }

    private void recalculateLawyerRating(Lawyer lawyer) {
        List<Review> reviews = reviewRepository.findByLawyer(lawyer);
        if (reviews.isEmpty()) {
            lawyer.setRating(5.0);
            lawyer.setTotalReviews(0);
        } else {
            double sum = 0;
            for (Review r : reviews) {
                sum += r.getRating();
            }
            lawyer.setRating(sum / reviews.size());
            lawyer.setTotalReviews(reviews.size());
        }
        lawyerRepository.save(lawyer);
    }

    @Transactional
    public void approveLawyer(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));
        lawyer.setIsVerified(true);
        lawyer.setVerificationStatus("APPROVED");
        lawyerRepository.save(lawyer);

        Notification notif = new Notification();
        notif.setUser(lawyer.getUser());
        notif.setTitle("Advocate Profile Verified!");
        notif.setMessage("Congratulations! Your CitizenLex legal advocate profile has been approved.");
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);
    }

    @Transactional
    public void rejectLawyer(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));
        lawyer.setIsVerified(false);
        lawyer.setVerificationStatus("REJECTED");
        lawyerRepository.save(lawyer);

        Notification notif = new Notification();
        notif.setUser(lawyer.getUser());
        notif.setTitle("Advocate Profile Rejected");
        notif.setMessage("Your advocate credentials check failed. Please re-submit valid bar documents.");
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);
    }

    @Transactional
    public void suspendLawyer(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));
        lawyer.setIsVerified(false);
        lawyer.setVerificationStatus("PENDING");
        lawyerRepository.save(lawyer);
    }

    public List<Lawyer> recommendLawyers(String userQuery) {
        // Integrate AI lawyer recommendation engine using Gemini model service
        try {
            String prompt = "Based on the client legal issue: '" + userQuery + "', categorize it into exactly one of these areas: " +
                    "Family Law, Criminal Defense, Corporate Law, Civil Litigation, Labor Law, Intellectual Property, Real Estate Law, Constitutional Law. " +
                    "Respond with ONLY the name of the categorization sector.";
            String categoryResponse = geminiService.generateResponse(prompt);
            String category = categoryResponse != null ? categoryResponse.trim() : "Civil Litigation";

            Optional<Specialization> spec = specializationRepository.findByName(category);
            if (spec.isPresent()) {
                // Return verified lawyers under this specialization sorted by rating
                return lawyerRepository.findAll((Specification<Lawyer>) (root, query, cb) -> cb.and(
                        cb.equal(root.get("verificationStatus"), "APPROVED"),
                        cb.equal(root.get("specialization"), spec.get())
                ));
            }
        } catch (Exception e) {
            System.err.println("Gemini recommendation error: " + e.getMessage());
        }

        // Fallback: return verified lawyers sorted by highest rating
        return getFilteredLawyers(null, null, null, null, null, null, null, "rating_desc", null, null, null, null);
    }
}
