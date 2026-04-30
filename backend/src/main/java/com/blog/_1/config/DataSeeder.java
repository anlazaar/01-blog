package com.blog._1.config;

import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        if (userRepository.findByUsername("anlazaar").isEmpty()) {
            User admin = new User();
            admin.setUsername("anlazaar");
            admin.setFirstname("Anass");
            admin.setLastname("Lazaar");
            admin.setEmail("anlazaar@01blog.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setBio("01 Blog Admin");
            admin.setCompletedAccount(true);
            admin.setBanned(false);

            userRepository.save(admin);
        }

        String[][] usersData = {
                { "Yassine", "Bennani" }, { "Sara", "El Amrani" }, { "Omar", "Tazi" },
                { "Lina", "Benali" }, { "Mehdi", "Alaoui" }, { "Nadia", "Idrissi" },
                { "Hassan", "Zerouali" }, { "Imane", "Fassi" }, { "Rachid", "Kabbaj" },
                { "Salma", "Berrada" }, { "Zakaria", "Chraibi" }, { "Hajar", "Toumi" },
                { "Karim", "Lahlou" }, { "Aya", "Mouline" }, { "Younes", "Skalli" },
                { "Meryem", "Benjelloun" }, { "Adil", "Boussaid" }, { "Soukaina", "Othmani" },
                { "Hamza", "Cherkaoui" }, { "Khadija", "El Fihri" }, { "Nabil", "Raji" },
                { "Fatima", "Zahraoui" }, { "Anouar", "Benkirane" }, { "Oumaima", "Slaoui" },
                { "Tarik", "El Khatib" }, { "Asmae", "Bennis" }, { "Reda", "Haddad" },
                { "Ilham", "Boukili" }, { "Ayoub", "Lamrani" }, { "Siham", "Tijani" },
                { "Driss", "El Ghazali" }, { "Naima", "Ouazzani" }, { "Walid", "El Youssfi" },
                { "Samira", "Khalfi" }, { "Hicham", "El Malki" }
        };

        String[] bios = {
                "Passionate about technology and innovation.",
                "Full-stack developer sharing knowledge.",
                "Design enthusiast and creative thinker.",
                "Building projects and learning every day.",
                "Tech lover exploring new tools.",
                "Software engineer focused on clean code.",
                "Curious mind diving into web development.",
                "Creating digital experiences.",
                "Problem solver and code enthusiast.",
                "Always learning, always building."
        };

        for (int i = 0; i < usersData.length; i++) {
            String firstName = usersData[i][0];
            String lastName = usersData[i][1];

            String username = (firstName + lastName).toLowerCase().replace(" ", "");
            String email = username + "@01blog.com";

            if (userRepository.findByUsername(username).isPresent()) {
                continue;
            }

            User user = new User();
            user.setUsername(username);
            user.setFirstname(firstName);
            user.setLastname(lastName);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("user123"));
            user.setRole(Role.USER);
            user.setBio(bios[i % bios.length]);
            user.setCompletedAccount(true);
            user.setBanned(false);

            userRepository.save(user);
        }
    }
}