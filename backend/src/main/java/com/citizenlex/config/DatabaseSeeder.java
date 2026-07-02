package com.citizenlex.config;

import com.citizenlex.entities.*;
import com.citizenlex.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RightsCategoryRepository categoryRepository;

    @Autowired
    private RightsContentRepository contentRepository;

    @Autowired
    private GovernmentSchemeRepository schemeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SpecializationRepository specializationRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private LawyerRepository lawyerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.core.env.Environment environment;

    public boolean isDevelopmentMode() {
        String[] activeProfiles = environment.getActiveProfiles();
        List<String> profiles = Arrays.asList(activeProfiles);
        if (profiles.contains("prod") || profiles.contains("production")) {
            return false;
        }
        return true;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        Role userRole = seedRole("ROLE_USER");
        Role lawyerRole = seedRole("ROLE_LAWYER");
        Role adminRole = seedRole("ROLE_ADMIN");

        // 2. Seed Admin User
        seedAdminUser(adminRole);

        // 3. Seed Specializations
        seedSpecializations();

        // 4. Seed Cities
        seedCities();

        // 5. Seed Mock Lawyers (always seed if database is empty to guarantee demo data availability)
        seedMockLawyers(lawyerRole);

        // 6. Seed Rights Categories & Content
        if (categoryRepository.count() == 0) {
            seedRightsAndCategories();
        }

        // 7. Seed Government Schemes
        if (schemeRepository.count() == 0) {
            seedGovernmentSchemes();
        }

        // 8. Seed Notifications
        if (notificationRepository.countByUserIsNull() == 0) {
            seedNotifications();
        }
    }

    private void seedNotifications() {
        List<Notification> notifications = new ArrayList<>();

        // Legal Tips
        notifications.add(new Notification("Know Your Rights: Right to Information",
                "Under the RTI Act 2005, any Indian citizen can request information from any public authority within 30 days. Filing fee is just Rs. 10. Use this powerful tool to fight corruption and get government records.",
                "TIP"));
        notifications.add(new Notification("Free Legal Aid is Your Right",
                "Under the Legal Services Authorities Act, 1987, citizens below poverty line, women, children, SC/ST, and disaster victims are entitled to FREE legal representation and advice from DLSA (District Legal Services Authority).",
                "TIP"));
        notifications.add(new Notification("Consumer Rights: 1800-11-4000",
                "The National Consumer Helpline is free. You can call 1800-11-4000 or file online at consumerhelpline.gov.in for product defects, service failures, overcharging, and e-commerce disputes. Always keep your bill/invoice safe.",
                "RIGHT"));
        notifications.add(new Notification("Right to Equal Pay for Equal Work",
                "Under Article 39(d) of the Indian Constitution and the Equal Remuneration Act 1976, men and women must receive equal pay for equal work. Any violation can be reported to the Labour Commissioner.",
                "RIGHT"));
        notifications.add(new Notification("Workplace Harassment: POSH Act 2013",
                "Every organization with 10+ employees must have an Internal Complaints Committee (ICC) for sexual harassment complaints. If yours doesn't, report to the District Officer under POSH Act 2013.",
                "RIGHT"));

        // Scam Alerts
        notifications.add(new Notification("⚠️ Alert: Fake Government Scheme SMS Scams",
                "Fraudsters are sending fake SMS claiming Rs. 5000-50,000 government benefits. They ask for Aadhaar/bank details to 'transfer funds'. NEVER share OTP or bank details. Government schemes require application — they never auto-credit money via SMS links.",
                "ALERT"));
        notifications.add(new Notification("⚠️ Alert: Job Offer Fraud Rising in Tamil Nadu",
                "Online job scams promising high-salary government/private jobs for a 'registration fee' are increasing. Report to cybercrime.gov.in or call 1930 (Cyber Crime Helpline). Legitimate employers NEVER ask for money to hire you.",
                "ALERT"));
        notifications.add(new Notification("⚠️ Alert: Fake Lawyer Scam",
                "Beware of individuals posing as lawyers who approach families of accused persons and charge money for bail, court appearances, or case withdrawal. Always verify advocate enrollment number at the Bar Council website.",
                "ALERT"));

        // Scheme Updates
        notifications.add(new Notification("PM-KISAN: Check Your Payment Status",
                "PM Kisan Samman Nidhi provides Rs. 6000/year to eligible farmers in 3 installments. Check your payment status at pmkisan.gov.in. If your payment is pending, contact the local Agriculture Officer.",
                "SCHEME"));
        notifications.add(new Notification("Ayushman Bharat: Check Your Eligibility",
                "PM-JAY provides health insurance of Rs. 5 lakh/year for secondary and tertiary care. Check eligibility at pmjay.gov.in or call 14555. Tamil Nadu operates 'MaKaLai Thittam' (Chief Minister's Comprehensive Health Insurance Scheme) similarly.",
                "SCHEME"));

        // Reminders
        notifications.add(new Notification("📅 Legal Reminder: File RTI Appeals on Time",
                "If you filed an RTI and didn't get a response within 30 days, file a First Appeal within 30 days of the deadline to the First Appellate Authority. If unsatisfied, file Second Appeal to CIC/SIC within 90 days.",
                "REMINDER"));
        notifications.add(new Notification("📅 Reminder: Consumer Complaint Time Limit",
                "Consumer complaints must be filed within 2 years from the date of cause of action under the Consumer Protection Act 2019. Don't delay — gather evidence and file at the District Consumer Commission soon.",
                "REMINDER"));

        notificationRepository.saveAll(notifications);
    }

    private Role seedRole(String name) {
        Optional<Role> roleOpt = roleRepository.findByName(name);
        if (roleOpt.isPresent()) {
            return roleOpt.get();
        }
        Role role = new Role(name);
        return roleRepository.save(role);
    }

    private void seedAdminUser(Role adminRole) {
        String adminEmail = "admin@citizenlex.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setFirstName("Admin");
            admin.setLastName("CitizenLex");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);

            userRepository.save(admin);
            System.out.println("Default admin user created successfully: admin@citizenlex.com / Admin@123");
        }
    }

    private void seedRightsAndCategories() {
        // Categories
        RightsCategory fundamental = categoryRepository.save(new RightsCategory(
                "Fundamental Rights", 
                "Rights guaranteed under Part III of the Constitution of India, applicable to all citizens without discrimination.", 
                "shield"
        ));
        
        RightsCategory consumer = categoryRepository.save(new RightsCategory(
                "Consumer Rights", 
                "Rights safeguarding buyers from unfair trade practices, defect items, and service deficiencies.", 
                "cart"
        ));

        RightsCategory women = categoryRepository.save(new RightsCategory(
                "Women's Rights", 
                "Special legal safeguards, policies, and privileges for women regarding safety, family, work, and health.", 
                "gender-female"
        ));

        RightsCategory child = categoryRepository.save(new RightsCategory(
                "Child Rights", 
                "Fundamental human protections tailored specifically for minors, focusing on education, health, and abuse protection.", 
                "people"
        ));

        RightsCategory labour = categoryRepository.save(new RightsCategory(
                "Labour Rights", 
                "Rights defining employer obligations, minimum wages, fair hours, and healthy workspaces for employees.", 
                "briefcase"
        ));

        // --- Seed Fundamental Rights Content ---
        contentRepository.save(new RightsContent(
                fundamental,
                "Right to Equality (Article 14)",
                "Article 14 of the Constitution guarantees equality before the law and equal protection of the laws within the territory of India. It prohibits discrimination on grounds of religion, race, caste, sex, or place of birth.",
                "சமத்துவ உரிமை (பிரிவு 14)",
                "இந்திய அரசியலமைப்பின் 14-வது பிரிவு சட்டத்தின் முன் அனைவரும் சமம் மற்றும் அனைவருக்கும் சட்டத்தின் சமமான பாதுகாப்பு என்பதை உத்தரவாதம் செய்கிறது. மதம், இனம், சாதி, பாலினம் அல்லது பிறப்பிடத்தின் அடிப்படையில் பாகுபாடு காட்டுவதை இது தடை செய்கிறது.",
                "Constitution of India Part III, Supreme Court Judgements on Article 14"
        ));

        contentRepository.save(new RightsContent(
                fundamental,
                "Right to Freedom of Speech (Article 19)",
                "Article 19(1)(a) guarantees all citizens the right to freedom of speech and expression. However, reasonable restrictions can be imposed in the interest of public order, decency, or morality.",
                "பேச்சு மற்றும் கருத்து சுதந்திர உரிமை (பிரிவு 19)",
                "பிரிவு 19(1)(a) அனைத்து குடிமக்களுக்கும் பேச்சு மற்றும் கருத்து சுதந்திரத்திற்கான உரிமையை வழங்குகிறது. எனினும், பொது ஒழுங்கு, கண்ணியம் அல்லது ஒழுக்கத்தின் நலன் கருதி நியாயமான கட்டுப்பாடுகள் விதிக்கப்படலாம்.",
                "Article 19 Legal Reference Manual"
        ));

        // --- Seed Consumer Rights Content ---
        contentRepository.save(new RightsContent(
                consumer,
                "Right to seek Redressal",
                "Consumers have the right to seek redressal against unfair trade practices or exploitation. They can file complaints in consumer forums for product replacement, refund, or damages.",
                "இழப்பீடு பெறும் உரிமை",
                "நியாயமற்ற வர்த்தக நடைமுறைகள் அல்லது சுரண்டலுக்கு எதிராக நுகர்வோருக்கு இழப்பீடு கோர உரிமை உண்டு. தயாரிப்பு மாற்றீடு, பணம் திரும்பப் பெறுதல் அல்லது சேதங்களுக்கு அவர்கள் நுகர்வோர் மன்றங்களில் புகார் அளிக்கலாம்.",
                "Consumer Protection Act 2019 Rules, E-Daakhil Portal Guide"
        ));

        // --- Seed Women's Rights Content ---
        contentRepository.save(new RightsContent(
                women,
                "Protection from Domestic Violence",
                "The Domestic Violence Act of 2005 provides women with civil remedies against physical, emotional, verbal, sexual, and economic abuse within the household, including protection and residence orders.",
                "குடும்ப வன்முறையிலிருந்து பாதுகாப்பு",
                "2005-ஆம் ஆண்டின் குடும்ப வன்முறை தடுப்புச் சட்டம், பெண்களுக்கு வீட்டிற்குள் நடக்கும் உடல், உணர்ச்சி, வாய்மொழி, பாலியல் மற்றும் பொருளாதார ரீதியான வன்கொடுமைகளுக்கு எதிராக சிவில் தீர்வுகளை வழங்குகிறது.",
                "Protection of Women from Domestic Violence Act, 2005"
        ));

        // --- Seed Child Rights Content ---
        contentRepository.save(new RightsContent(
                child,
                "Right to Free & Compulsory Education (RTE)",
                "The RTE Act 2009 guarantees free and compulsory education for all children between the ages of 6 and 14. Private schools must reserve 25% of seats for economically disadvantaged children.",
                "இலவச மற்றும் கட்டாயக் கல்வி உரிமை (RTE)",
                "RTE சட்டம் 2009, 6 முதல் 14 வயதுக்குட்பட்ட அனைத்து குழந்தைகளுக்கும் இலவச மற்றும் கட்டாயக் கல்வியை உத்தரவாதம் செய்கிறது. தனியார் பள்ளிகள் பொருளாதார ரீதியாக பின்தங்கிய குழந்தைகளுக்கு 25% இடங்களை ஒதுக்க வேண்டும்.",
                "Right of Children to Free and Compulsory Education Act, 2009"
        ));

        // --- Seed Labour Rights Content ---
        contentRepository.save(new RightsContent(
                labour,
                "Fair Working Hours and Overtime Pay",
                "Under the Factories Act 1948, adult workers cannot be required to work for more than 9 hours a day or 48 hours a week. Any work beyond this must be compensated with double the ordinary wage rate as overtime.",
                "நியாயமான வேலை நேரம் மற்றும் கூடுதல் நேர ஊதியம்",
                "தொழிற்சாலைகள் சட்டம் 1948-ன் படி, ஒரு வயது வந்த தொழிலாளி ஒரு நாளைக்கு 9 மணி நேரத்திற்கு மேல் அல்லது வாரத்திற்கு 48 மணி நேரத்திற்கு மேல் வேலை செய்ய வேண்டியதில்லை. அதற்கு மேல் செய்யும் வேலைக்கு கூடுதல் நேர ஊதியமாக இரட்டிப்பு சம்பளம் வழங்கப்பட வேண்டும்.",
                "Factories Act 1948, Labour Law Handbook"
        ));
    }

    private void seedGovernmentSchemes() {
        schemeRepository.save(new GovernmentScheme(
                "PM Kisan Samman Nidhi",
                "Farmers",
                "Small and marginal farmers holding cultivable land up to 2 hectares.",
                "Aadhaar card, Land ownership papers, Bank account details.",
                "Apply online via PM Kisan portal or visit the nearest Common Service Centre (CSC).",
                "https://pmkisan.gov.in/"
        ));

        schemeRepository.save(new GovernmentScheme(
                "Beti Bachao Beti Padhao",
                "Women & Education",
                "Parents of girl children aged below 10 years, seeking savings and educational support.",
                "Birth certificate of girl child, Aadhaar cards of parents, Address proof.",
                "Open a Sukanya Samriddhi account at any post office or commercial bank branch.",
                "https://www.wcd.nic.in/schemes/beti-bachao-beti-padhao"
        ));

        schemeRepository.save(new GovernmentScheme(
                "Ayushman Bharat Yojana (PM-JAY)",
                "Healthcare",
                "Families classified as poor, informal, or low-income as per Social Economic Caste Census.",
                "Aadhaar card, Ration card (NFSA), Proof of income.",
                "Verify eligibility on the PMJAY portal and visit any empanelled hospital to obtain the Golden Card.",
                "https://pmjay.gov.in/"
        ));

        schemeRepository.save(new GovernmentScheme(
                "Atal Pension Yojana (APY)",
                "Social Security",
                "All citizens of India aged between 18 and 40 years holding a savings bank account.",
                "Aadhaar card, Savings Bank account number, Mobile number registration.",
                "Visit your savings bank branch, fill out the APY application, and set up auto-debit for contributions.",
                "https://www.npscra.nsdl.co.in/scheme-details.php"
        ));
    }

    private void seedSpecializations() {
        if (specializationRepository.count() == 0) {
            specializationRepository.save(new Specialization("Civil Litigation"));
            specializationRepository.save(new Specialization("Criminal Defense"));
            specializationRepository.save(new Specialization("Corporate Law"));
            specializationRepository.save(new Specialization("Family Law"));
            specializationRepository.save(new Specialization("Labor Law"));
            specializationRepository.save(new Specialization("Intellectual Property"));
            specializationRepository.save(new Specialization("Real Estate Law"));
            specializationRepository.save(new Specialization("Constitutional Law"));
        }
    }

    private void seedCities() {
        String[] tnDistricts = {
            "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
            "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
            "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
            "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
            "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
            "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
            "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
            "Vellore", "Viluppuram", "Virudhunagar", "Bangalore", "Mumbai", "Delhi"
        };
        for (String name : tnDistricts) {
            if (cityRepository.findByName(name).isEmpty()) {
                cityRepository.save(new City(name));
            }
        }
    }

    public void seedSpecializationsAndCitiesIfEmpty() {
        seedSpecializations();
        seedCities();
    }

    public long seedMockLawyersList(Role lawyerRole) {
        Specialization civil = specializationRepository.findByName("Civil Litigation").orElse(null);
        Specialization crim = specializationRepository.findByName("Criminal Defense").orElse(null);
        Specialization fam = specializationRepository.findByName("Family Law").orElse(null);
        Specialization corp = specializationRepository.findByName("Corporate Law").orElse(null);
        Specialization labor = specializationRepository.findByName("Labor Law").orElse(null);
        Specialization ip = specializationRepository.findByName("Intellectual Property").orElse(null);
        Specialization realEstate = specializationRepository.findByName("Real Estate Law").orElse(null);
        Specialization constitutional = specializationRepository.findByName("Constitutional Law").orElse(null);

        long countBefore = lawyerRepository.count();

        String[] tnDistricts = {
            "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
            "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
            "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
            "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
            "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
            "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
            "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
            "Vellore", "Viluppuram", "Virudhunagar"
        };

        double[] lats = {
            11.1401, 12.6917, 13.0827, 11.0168, 11.7480,
            12.1353, 10.3673, 11.3410, 11.7384, 12.8387,
            8.0883, 10.9601, 12.5186, 9.9252, 11.1018,
            10.7656, 11.2189, 11.4102, 11.2342, 10.3797,
            9.3639, 12.9274, 11.6643, 9.8433, 8.9593,
            10.7870, 10.0104, 8.7642, 10.7905, 8.7139,
            12.4929, 11.1085, 13.1438, 12.2280, 10.7722,
            12.9165, 11.9401, 9.5680
        };

        double[] lons = {
            79.0747, 79.9750, 80.2707, 76.9558, 79.7714,
            78.1560, 77.9803, 77.7172, 78.9639, 79.7016,
            77.5385, 78.0766, 78.2137, 78.1198, 79.6522,
            79.8433, 78.1673, 76.6950, 78.8797, 78.8202,
            78.8394, 79.3327, 78.1460, 78.4833, 77.3142,
            79.1378, 77.4777, 78.1348, 78.7047, 77.7567,
            78.5678, 77.3411, 79.9077, 79.0665, 79.6361,
            79.1325, 79.4861, 77.9624
        };

        Specialization[] specs = { civil, crim, fam, corp, labor, ip, realEstate, constitutional };

        String[] firstNamesA = { "Karthik", "Arun", "Rajesh", "Vikram", "Manoj", "Suresh", "Kannan", "Ramesh", "Hari", "Vijay",
                                 "Sanjay", "Ganesh", "Kumar", "Babu", "Bala", "Manikandan", "Saravanan", "Murugan", "Selvam", "Prabhu",
                                 "Senthil", "Velu", "Kathir", "Jaya", "Prakash", "Dinesh", "Naveen", "Deepak", "Anand", "Raghu",
                                 "Sudhakar", "Prasad", "Shankar", "Vasu", "Ram", "Krishna", "Madhavan", "Govind" };
                                 
        String[] lastNamesA = { "Raman", "Kumar", "Balaji", "Sethupathi", "Moorthy", "Krishnan", "Nair", "Prasad", "Raman", "Raghavan",
                                "V", "Rajan", "Suri", "Patel", "Sharma", "Raja", "Kumar", "Nair", "Singh", "Sundaram",
                                "Pillai", "Gounder", "Thevar", "Naicker", "Chettiar", "Iyer", "Iyengar", "Reddy", "Naidu", "Rao",
                                "Mudaliar", "Achari", "Devar", "Kounder", "Pandi", "Dharman", "Samy", "Karthikeyan" };

        String[] firstNamesB = { "Sneha", "Priya", "Divya", "Lakshmi", "Anitha", "Meera", "Sandhya", "Chitra", "Radha", "Revathi",
                                 "Uma", "Geetha", "Kavitha", "Sangeetha", "Vidya", "Asha", "Rekha", "Sita", "Saraswathi", "Malathi",
                                 "Shanthi", "Preethi", "Deepa", "Vasanthi", "Kokila", "Subha", "Nithya", "Abirami", "Aarthi", "Bindu",
                                 "Pooja", "Harini", "Swathi", "Shruthi", "Pavithra", "Sindhu", "Gayathri", "Janani" };

        String[] lastNamesB = { "Rajan", "Sharma", "Nair", "Priya", "Devi", "Nair", "Raman", "Raghavan", "Kari", "Mani",
                                "Selvi", "Latha", "Kumari", "Valli", "Chidambaram", "Ananth", "Sundari", "Gowri", "Lakshmi", "Banumathi",
                                "Vidhya", "Kalpana", "Archana", "Nisha", "Rani", "Amutha", "Chitra", "Soundari", "Kala", "Roopa",
                                "Aswini", "Meenakshi", "Kamala", "Bharathi", "Kavya", "Divya", "Sowmya", "Janaki" };

        String[] avatarsA = {
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
            "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
            "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
        };

        String[] avatarsB = {
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150",
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
            "https://images.unsplash.com/photo-1534751516642-a131fed10495?w=150"
        };

        for (int i = 0; i < tnDistricts.length; i++) {
            String districtName = tnDistricts[i];
            City city = cityRepository.findByName(districtName).orElse(null);
            if (city == null) continue;

            // Lawyer A in district
            Specialization specA = specs[(i * 2) % specs.length];
            String emailA = "lawyer_" + districtName.toLowerCase().replace(" ", "_") + "_a@citizenlex.com";
            String advIdA = "AP-" + (20000 + i) + "/202" + (i % 5 + 1);
            double feeA = 700.0 + (i * 30) % 900;
            int expA = 5 + (i * 2) % 12;
            double ratingA = 4.4 + (i * 0.05) % 0.6;
            String avatarA = avatarsA[i % avatarsA.length];
            String officeAddrA = "No. " + (i + 1) + ", Court Road, Near District Court, " + districtName + ", Tamil Nadu";

            createMockLawyer(emailA, firstNamesA[i], lastNamesA[i], advIdA, specA, city, expA, feeA,
                    "LL.B, State Bar Enrollment", "Distinguished Panel Advocate Award",
                    "Dedicated and results-oriented advocate specializing in " + specA.getName() + ", with over " + expA + " years of active court practice in " + districtName + ".",
                    avatarA, ratingA, "English, Tamil", "Tamil Nadu", districtName, officeAddrA, lats[i], lons[i], lawyerRole);

            // Lawyer B in district (with slightly offset coordinates)
            Specialization specB = specs[(i * 2 + 1) % specs.length];
            String emailB = "lawyer_" + districtName.toLowerCase().replace(" ", "_") + "_b@citizenlex.com";
            String advIdB = "AP-" + (30000 + i) + "/202" + (i % 5 + 1);
            double feeB = 900.0 + (i * 40) % 1100;
            int expB = 7 + (i * 3) % 15;
            double ratingB = 4.5 + (i * 0.04) % 0.5;
            String avatarB = avatarsB[i % avatarsB.length];
            String officeAddrB = "Chamber Suite " + (char)('A' + (i % 6)) + "-" + (i * 3 + 2) + ", Bar Council Chambers, " + districtName + ", Tamil Nadu";

            createMockLawyer(emailB, firstNamesB[i], lastNamesB[i], advIdB, specB, city, expB, feeB,
                    "LL.B, LL.M, Senior Counsel", "Member of Bar Association Council",
                    "Renowned legal counsel in " + specB.getName() + " representing individuals and corporations at all judicial levels across " + districtName + ".",
                    avatarB, ratingB, "English, Tamil", "Tamil Nadu", districtName, officeAddrB, lats[i] + 0.008, lons[i] - 0.008, lawyerRole);
        }

        return lawyerRepository.count() - countBefore;
    }

    private void seedMockLawyers(Role lawyerRole) {
        if (lawyerRepository.count() < 10) {
            seedMockLawyersList(lawyerRole);
        }
    }

    public void createMockLawyer(String email, String first, String last, String advocateId,
                                  Specialization spec, City city, int exp, double fee,
                                  String qual, String ach, String bio, String profileImageUrl,
                                  double rating, String languages, String state, String district,
                                  String officeAddress, Double latitude, Double longitude, Role lawyerRole) {

        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isEmpty()) {
            user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("Lawyer@123"));
            user.setFirstName(first);
            user.setLastName(last);
            user.setProfileImageUrl(profileImageUrl);
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user.getRoles().add(lawyerRole);
            user = userRepository.save(user);
        } else {
            user = userOpt.get();
            user.setProfileImageUrl(profileImageUrl);
            user = userRepository.save(user);
        }

        Optional<Lawyer> lawyerOpt = lawyerRepository.findByUser(user);
        Lawyer lawyer = lawyerOpt.orElseGet(Lawyer::new);
        lawyer.setUser(user);
        lawyer.setAdvocateId(advocateId);
        lawyer.setSpecialization(spec);
        lawyer.setCity(city);
        lawyer.setExperienceYears(exp);
        lawyer.setConsultationFee(fee);
        lawyer.setQualifications(qual);
        lawyer.setAchievements(ach);
        lawyer.setBio(bio);
        lawyer.setLanguages(languages);
        lawyer.setWorkingHours("09:00 - 18:00");
        lawyer.setIsVerified(true);
        lawyer.setVerificationStatus("APPROVED");
        lawyer.setIsOnline(true);
        lawyer.setRating(rating);
        lawyer.setTotalReviews(0);
        lawyer.setState(state);
        lawyer.setDistrict(district);
        lawyer.setOfficeAddress(officeAddress);
        lawyer.setLatitude(latitude);
        lawyer.setLongitude(longitude);
        lawyerRepository.save(lawyer);
    }
}
