import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "lemurs.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lemur_species (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            common_name TEXT NOT NULL UNIQUE,
            scientific_name TEXT NOT NULL,
            conservation_status TEXT NOT NULL,
            habitat TEXT NOT NULL,
            description TEXT NOT NULL,
            image_filename TEXT NOT NULL,
            weight_range TEXT,
            lifespan TEXT,
            diet TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lemur_facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            species TEXT NOT NULL,
            fact TEXT NOT NULL,
            image_filename TEXT NOT NULL,
            category TEXT DEFAULT 'general'
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            wrong_answer_1 TEXT NOT NULL,
            wrong_answer_2 TEXT NOT NULL,
            wrong_answer_3 TEXT NOT NULL,
            difficulty TEXT DEFAULT 'medium'
        )
    """)

    # Seed species data
    cur.execute("SELECT COUNT(*) FROM lemur_species")
    if cur.fetchone()[0] == 0:
        species_data = [
            (
                "Ring-tailed Lemur",
                "Lemur catta",
                "Endangered",
                "Dry deciduous forests, gallery forests, and spiny forests of southern and southwestern Madagascar",
                "The most recognizable lemur species, famous for its long, black-and-white ringed tail. Highly social, they live in groups of up to 30 individuals led by a dominant female.",
                "ring_tailed.jpg",
                "2.2 - 3.5 kg",
                "16 - 19 years in the wild",
                "Omnivore - fruit, leaves, flowers, bark, sap, and occasionally insects",
            ),
            (
                "Aye-aye",
                "Daubentonia madagascariensis",
                "Endangered",
                "Eastern rainforests and dry deciduous forests throughout Madagascar",
                "The world's largest nocturnal primate, with rodent-like teeth, bat-like ears, and a skeletal middle finger. Once thought to be a rodent, it's actually the sole member of its family.",
                "aye_aye.jpg",
                "2.5 - 2.6 kg",
                "20 - 23 years",
                "Omnivore - insect larvae (extracted from wood), seeds, nectar, fungi",
            ),
            (
                "Indri",
                "Indri indri",
                "Critically Endangered",
                "Montane and lowland rainforests of eastern Madagascar, up to 1800m elevation",
                "The largest living lemur, reaching up to 72 cm in body length. Famous for their haunting, whale-like songs that carry for miles through the forest canopy.",
                "indri.jpg",
                "6 - 9.5 kg",
                "15 - 18 years in the wild",
                "Herbivore - young leaves, seeds, fruits, and flowers",
            ),
            (
                "Mouse Lemur",
                "Microcebus murinus",
                "Least Concern",
                "Dry deciduous forests of western and southern Madagascar",
                "One of the smallest primates in the world, small enough to fit in a human hand. Despite their tiny size, they are fierce predators of insects and have excellent night vision.",
                "mouse_lemur.jpg",
                "30 - 70 g",
                "6 - 8 years in the wild, up to 15 in captivity",
                "Omnivore - insects, fruit, flowers, nectar, leaves, and small vertebrates",
            ),
            (
                "Verreaux's Sifaka",
                "Propithecus verreauxi",
                "Critically Endangered",
                "Dry deciduous forests and spiny forests of western and southern Madagascar",
                "Famous for their spectacular sideways hopping dance when crossing open ground. They are powerful vertical clingers and leapers, able to jump up to 10 meters between trees.",
                "sifaka.jpg",
                "3 - 3.5 kg",
                "18 - 20 years",
                "Herbivore - leaves, fruit, flowers, and bark",
            ),
            (
                "Red Ruffed Lemur",
                "Varecia rubra",
                "Critically Endangered",
                "Masoala Peninsula rainforests in northeastern Madagascar",
                "One of the largest lemurs and among the most beautiful, with striking russet-red fur. They are important seed dispersers and one of the few primates that build nests for their young.",
                "red_ruffed.jpg",
                "3.3 - 3.6 kg",
                "15 - 20 years in the wild",
                "Frugivore - primarily fruit, also nectar, seeds, and leaves",
            ),
            (
                "Black-and-white Ruffed Lemur",
                "Varecia variegata",
                "Critically Endangered",
                "Eastern rainforests of Madagascar",
                "The largest member of the Lemuridae family, with a striking patchwork of black and white fur. They have the loudest call of any primate relative to their body size.",
                "bw_ruffed.jpg",
                "3.1 - 4.1 kg",
                "15 - 20 years",
                "Frugivore - fruit makes up 92% of diet, also flowers and leaves",
            ),
            (
                "Blue-eyed Black Lemur",
                "Eulemur flavifrons",
                "Critically Endangered",
                "Subhumid forests of northwestern Madagascar (Sahamalaza Peninsula)",
                "The only primate other than humans to have truly blue eyes. Males are jet black while females are reddish-brown, making them one of the most sexually dimorphic lemur species.",
                "blue_eyed.jpg",
                "1.8 - 2.0 kg",
                "15 - 20 years",
                "Omnivore - fruit, flowers, nectar, leaves, and insects",
            ),
            (
                "Coquerel's Sifaka",
                "Propithecus coquereli",
                "Critically Endangered",
                "Dry deciduous forests of northwestern Madagascar",
                "A strikingly beautiful sifaka with a white body and deep maroon patches. Like all sifakas, they dance sideways across open ground and are powerful leapers.",
                "sifaka.jpg",
                "3.7 - 4.3 kg",
                "20 - 25 years",
                "Herbivore - leaves, flowers, fruit, and bark (can detoxify plant compounds)",
            ),
            (
                "Fat-tailed Dwarf Lemur",
                "Cheirogaleus medius",
                "Least Concern",
                "Dry deciduous forests of western Madagascar",
                "The only primate known to truly hibernate. They store fat in their tail during the wet season, then enter torpor for up to 7 months during the dry season.",
                "dwarf_lemur.jpg",
                "120 - 270 g (varies seasonally)",
                "Up to 20 years in captivity",
                "Omnivore - fruit, flowers, nectar, and insects",
            ),
            (
                "Crowned Lemur",
                "Eulemur coronatus",
                "Endangered",
                "Dry deciduous forests and lowland rainforests of northern Madagascar",
                "Named for the orange-brown crown marking on their heads. Both males and females have the crown, but males also have black fur on the top of the head while females are grey.",
                "crowned_lemur.jpg",
                "1.1 - 1.3 kg",
                "20 - 27 years",
                "Omnivore - fruit, flowers, and leaves",
            ),
            (
                "Golden Bamboo Lemur",
                "Hapalemur aureus",
                "Critically Endangered",
                "Bamboo forests of southeastern Madagascar, primarily Ranomafana National Park",
                "Discovered only in 1987, this lemur eats giant bamboo shoots containing enough cyanide to kill most animals. How it detoxifies this remains a scientific mystery.",
                "bamboo_lemur.jpg",
                "1.0 - 1.6 kg",
                "12 - 15 years",
                "Specialist - giant bamboo shoots, pith, and leaves (tolerates lethal cyanide levels)",
            ),
            (
                "Sportive Lemur",
                "Lepilemur edwardsi",
                "Endangered",
                "Dry deciduous forests of western Madagascar",
                "Nocturnal and solitary, sportive lemurs spend the day sleeping in tree holes. Despite their name, they are actually quite sedentary to conserve energy on their low-calorie leaf diet.",
                "sportive_lemur.jpg",
                "0.6 - 1.0 kg",
                "8 - 12 years",
                "Folivore - primarily leaves, supplemented by flowers and fruit",
            ),
            (
                "Eastern Woolly Lemur",
                "Avahi laniger",
                "Vulnerable",
                "Eastern rainforests of Madagascar, from sea level to 1600m",
                "A small, nocturnal lemur with dense, woolly fur that provides insulation in cool mountain forests. They form monogamous pair bonds and sleep together during the day.",
                "woolly_lemur.jpg",
                "0.9 - 1.3 kg",
                "Up to 9 years",
                "Folivore - primarily leaves, also buds and flowers",
            ),
            (
                "Fork-marked Lemur",
                "Phaner furcifer",
                "Endangered",
                "Dry deciduous forests of western and northern Madagascar",
                "Named for the distinctive dark fork-shaped marking on their head. They are specialized gum-feeders and have tooth combs adapted for gouging bark to access tree sap.",
                "fork_marked_lemur.jpg",
                "300 - 500 g",
                "Up to 12 years",
                "Specialist - primarily tree gum and sap, also nectar and insects",
            ),
            (
                "Diademed Sifaka",
                "Propithecus diadema",
                "Critically Endangered",
                "Montane and lowland rainforests of eastern Madagascar",
                "Often called the most beautiful lemur, with silky fur in a patchwork of gold, white, grey, and black. One of the largest sifakas and among the most endangered lemurs.",
                "diademed_sifaka.jpg",
                "5 - 7.3 kg",
                "15 - 20 years",
                "Herbivore - leaves, seeds, fruit, and flowers",
            ),
            (
                "Black Lemur",
                "Eulemur macaco",
                "Vulnerable",
                "Humid forests of northwestern Madagascar and nearby islands (Nosy Be, Nosy Komba)",
                "Males are entirely jet black while females are chestnut brown with white ear tufts. One of the few lemur species that thrives in human-altered habitats.",
                "black_lemur.jpg",
                "2.0 - 2.9 kg",
                "20 - 25 years",
                "Omnivore - fruit, flowers, leaves, fungi, and invertebrates",
            ),
            (
                "Mongoose Lemur",
                "Eulemur mongoz",
                "Critically Endangered",
                "Dry deciduous forests of northwestern Madagascar and the Comoros Islands",
                "One of only two lemur species found outside Madagascar (on Anjouan and Moheli in the Comoros). They switch from diurnal to nocturnal behavior seasonally.",
                "mongoose_lemur.jpg",
                "1.1 - 1.6 kg",
                "18 - 20 years",
                "Omnivore - fruit, flowers (especially nectar), and leaves",
            ),
            (
                "Pygmy Mouse Lemur",
                "Microcebus myoxinus",
                "Vulnerable",
                "Dry deciduous forests of western Madagascar (Kirindy Forest)",
                "The smallest primate in the world by average body mass, weighing just 30 grams. First described in 1852, it was lost to science until being rediscovered in 1993.",
                "pygmy_mouse_lemur.jpg",
                "24 - 38 g",
                "6 - 8 years",
                "Omnivore - insects, fruit, flowers, and nectar",
            ),
        ]
        cur.executemany(
            """INSERT INTO lemur_species
            (common_name, scientific_name, conservation_status, habitat, description,
             image_filename, weight_range, lifespan, diet)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            species_data,
        )
        print(f"Seeded {len(species_data)} lemur species.")

    # Seed facts
    cur.execute("SELECT COUNT(*) FROM lemur_facts")
    if cur.fetchone()[0] == 0:
        facts = [
            # Ring-tailed Lemur
            ("Ring-tailed Lemur", "Ring-tailed lemurs spend more time on the ground than any other lemur species, and they sunbathe in a yoga-like position each morning to warm up.", "ring_tailed.jpg", "behavior"),
            ("Ring-tailed Lemur", "Male ring-tailed lemurs engage in 'stink fights' by rubbing their tails with scent glands and waving them at rivals. The smelliest male wins.", "ring_tailed.jpg", "behavior"),
            ("Ring-tailed Lemur", "Ring-tailed lemurs are the most terrestrial of all lemur species, spending up to 33% of their time on the forest floor.", "ring_tailed.jpg", "behavior"),
            ("Ring-tailed Lemur", "A ring-tailed lemur's tail is longer than its body, measuring up to 63 cm compared to a body length of about 42 cm.", "ring_tailed.jpg", "anatomy"),
            ("Ring-tailed Lemur", "Ring-tailed lemur groups are matriarchal - females are dominant over males, and a single alpha female leads the troop.", "ring_tailed.jpg", "social"),
            ("Ring-tailed Lemur", "Baby ring-tailed lemurs ride on their mother's belly for the first two weeks, then switch to riding on her back like tiny jockeys.", "ring_tailed.jpg", "reproduction"),
            # Aye-aye
            ("Aye-aye", "The aye-aye has a uniquely thin middle finger that it uses to tap on trees and listen for insect larvae inside, then extracts them like a built-in fishing hook.", "aye_aye.jpg", "anatomy"),
            ("Aye-aye", "Aye-ayes are the world's largest nocturnal primate and the only primate that uses echolocation-like tapping to find food.", "aye_aye.jpg", "behavior"),
            ("Aye-aye", "In Malagasy folklore, the aye-aye is considered an omen of death. Villagers sometimes kill them on sight, contributing to their endangered status.", "aye_aye.jpg", "culture"),
            ("Aye-aye", "The aye-aye's front teeth never stop growing, similar to a rodent's. Scientists originally classified it as a rodent when it was first discovered in 1788.", "aye_aye.jpg", "anatomy"),
            ("Aye-aye", "Aye-ayes fill the ecological niche of a woodpecker in Madagascar - there are no woodpeckers on the island, so aye-ayes evolved to extract grubs from wood.", "aye_aye.jpg", "ecology"),
            ("Aye-aye", "An aye-aye's middle finger has a ball-and-socket joint, allowing it to rotate 360 degrees when probing for grubs inside tree bark.", "aye_aye.jpg", "anatomy"),
            # Indri
            ("Indri", "The indri is the largest living lemur and is known for its eerie, whale-like songs that can be heard up to 3 kilometers away through the forest.", "indri.jpg", "behavior"),
            ("Indri", "Indris have never successfully been kept in captivity - they refuse to eat and quickly decline, making wild habitat protection critical for their survival.", "indri.jpg", "conservation"),
            ("Indri", "Indri family groups sing together in chorus each morning to mark their territory. Each family has a unique song, like a musical fingerprint.", "indri.jpg", "behavior"),
            ("Indri", "The Malagasy name for the indri is 'babakoto', meaning 'father of the forest'. Legend says the indri is an ancestor of humans who stayed in the trees.", "indri.jpg", "culture"),
            ("Indri", "Unlike most lemurs, indris have virtually no tail - just a stubby 5 cm remnant. They are the only lemurs in this tailless club.", "indri.jpg", "anatomy"),
            ("Indri", "Indri songs follow rhythmic patterns similar to human music, with predictable timing intervals. They are one of the few animals with a sense of rhythm.", "indri.jpg", "behavior"),
            # Mouse Lemur
            ("Mouse Lemur", "Mouse lemurs are among the smallest primates in the world, weighing just 30-70 grams - about the same as a couple of AA batteries.", "mouse_lemur.jpg", "anatomy"),
            ("Mouse Lemur", "Mouse lemurs can enter a state of torpor during the dry season, lowering their metabolism to survive when food is scarce, reducing energy use by up to 90%.", "mouse_lemur.jpg", "biology"),
            ("Mouse Lemur", "Mouse lemurs have enormous eyes relative to their head size, giving them exceptional night vision for hunting insects in the dark.", "mouse_lemur.jpg", "anatomy"),
            ("Mouse Lemur", "There are at least 25 recognized species of mouse lemur, with new species still being discovered. Many look identical but are genetically distinct.", "mouse_lemur.jpg", "taxonomy"),
            ("Mouse Lemur", "Mouse lemurs are one of the most important models for studying primate evolution because they closely resemble the earliest primates that lived 60 million years ago.", "mouse_lemur.jpg", "science"),
            # Sifaka (Verreaux's)
            ("Verreaux's Sifaka", "Sifakas cannot walk on all fours. Instead, they hop sideways on their hind legs when crossing open ground, looking like tiny ballet dancers.", "sifaka.jpg", "behavior"),
            ("Verreaux's Sifaka", "Sifakas can leap up to 10 meters between trees, using their powerful hind legs like springs. They rotate in mid-air to land feet-first.", "sifaka.jpg", "anatomy"),
            ("Verreaux's Sifaka", "The name 'sifaka' comes from their alarm call - a loud 'shee-FAK!' that echoes through the forest when they spot a predator.", "sifaka.jpg", "behavior"),
            ("Verreaux's Sifaka", "Baby sifakas begin practicing their famous sideways dance hop within weeks of birth, clinging to their mothers as they leap between trees.", "sifaka.jpg", "reproduction"),
            # Red Ruffed Lemur
            ("Red Ruffed Lemur", "Red ruffed lemurs are one of the few primates that build nests for their young, and they can have litters of up to six babies - the largest of any lemur.", "red_ruffed.jpg", "reproduction"),
            ("Red Ruffed Lemur", "Red ruffed lemurs are critical pollinators of the traveller's palm tree. They push their snouts deep into flowers to drink nectar, transferring pollen.", "red_ruffed.jpg", "ecology"),
            ("Red Ruffed Lemur", "Red ruffed lemurs have a specialized 'toilet claw' on their second toe, used for grooming their thick, luxurious fur.", "red_ruffed.jpg", "anatomy"),
            ("Red Ruffed Lemur", "Found only on the Masoala Peninsula, their entire wild habitat is smaller than the city of Los Angeles.", "red_ruffed.jpg", "conservation"),
            # Black-and-white Ruffed Lemur
            ("Black-and-white Ruffed Lemur", "Black-and-white ruffed lemurs are the largest of the true lemur family and have the loudest call of any primate relative to their body size.", "bw_ruffed.jpg", "anatomy"),
            ("Black-and-white Ruffed Lemur", "They are the primary pollinator of the traveller's tree (Ravenala madagascariensis), Madagascar's national plant.", "bw_ruffed.jpg", "ecology"),
            ("Black-and-white Ruffed Lemur", "Unlike most primates, black-and-white ruffed lemurs park their babies in nests instead of carrying them, returning periodically to nurse.", "bw_ruffed.jpg", "reproduction"),
            ("Black-and-white Ruffed Lemur", "Their black-and-white pattern varies between individuals like a fingerprint. No two ruffed lemurs have exactly the same markings.", "bw_ruffed.jpg", "anatomy"),
            # Blue-eyed Black Lemur
            ("Blue-eyed Black Lemur", "The blue-eyed black lemur is one of the only primates other than humans to have truly blue eyes - a remarkably rare trait in the animal kingdom.", "blue_eyed.jpg", "anatomy"),
            ("Blue-eyed Black Lemur", "Male blue-eyed black lemurs are entirely black, while females are orange-brown. They're so different-looking that they were once classified as separate species.", "blue_eyed.jpg", "anatomy"),
            ("Blue-eyed Black Lemur", "Fewer than 1,000 blue-eyed black lemurs remain in the wild, confined to a tiny area of northwestern Madagascar smaller than a mid-sized city.", "blue_eyed.jpg", "conservation"),
            ("Blue-eyed Black Lemur", "Blue-eyed black lemurs are important seed dispersers. Some seeds only germinate after passing through their digestive system.", "blue_eyed.jpg", "ecology"),
            # Coquerel's Sifaka
            ("Coquerel's Sifaka", "Coquerel's sifakas have a specialized digestive system with an enlarged cecum that allows them to eat toxic plants that would be lethal to other animals.", "sifaka.jpg", "anatomy"),
            ("Coquerel's Sifaka", "Coquerel's sifakas are featured on the PBS children's show 'Zoboomafoo', making them one of the most famous lemur species in American pop culture.", "sifaka.jpg", "culture"),
            ("Coquerel's Sifaka", "These sifakas scent-mark trees by rubbing their chest glands against bark, creating an invisible map of territory boundaries.", "sifaka.jpg", "behavior"),
            # Fat-tailed Dwarf Lemur
            ("Fat-tailed Dwarf Lemur", "The fat-tailed dwarf lemur is the only primate known to truly hibernate, storing fat in its tail to survive for up to seven months.", "dwarf_lemur.jpg", "biology"),
            ("Fat-tailed Dwarf Lemur", "During hibernation, a fat-tailed dwarf lemur's body temperature fluctuates with ambient temperature, something no other primate does.", "dwarf_lemur.jpg", "biology"),
            ("Fat-tailed Dwarf Lemur", "Their tail can account for up to 40% of their body weight before hibernation - it's essentially a built-in energy backpack.", "dwarf_lemur.jpg", "anatomy"),
            ("Fat-tailed Dwarf Lemur", "Scientists study fat-tailed dwarf lemurs to understand human hibernation potential, which could be revolutionary for long-duration space travel.", "dwarf_lemur.jpg", "science"),
            # Crowned Lemur
            ("Crowned Lemur", "Crowned lemurs get their name from the striking orange-brown triangular patch on the top of their head, resembling a tiny crown.", "crowned_lemur.jpg", "anatomy"),
            ("Crowned Lemur", "Crowned lemurs can coexist peacefully with Sanford's brown lemurs in the same forests, something rare among closely related primate species.", "crowned_lemur.jpg", "ecology"),
            ("Crowned Lemur", "Female crowned lemurs are grey with an orange crown, while males are darker brown with a black and orange crown - a striking example of sexual dimorphism.", "crowned_lemur.jpg", "anatomy"),
            ("Crowned Lemur", "Crowned lemurs have been observed using millipedes as a natural insect repellent, rubbing the toxic arthropods on their fur to ward off parasites.", "crowned_lemur.jpg", "behavior"),
            # Golden Bamboo Lemur
            ("Golden Bamboo Lemur", "The golden bamboo lemur eats enough cyanide daily in bamboo shoots to kill most animals. A single day's intake could kill a human, yet it suffers no ill effects.", "bamboo_lemur.jpg", "biology"),
            ("Golden Bamboo Lemur", "The golden bamboo lemur wasn't discovered until 1987, proving that even large primates can remain hidden in Madagascar's dense rainforests.", "bamboo_lemur.jpg", "science"),
            ("Golden Bamboo Lemur", "Fewer than 1,000 golden bamboo lemurs exist in the wild, almost entirely within Ranomafana National Park, which was established partly to protect them.", "bamboo_lemur.jpg", "conservation"),
            ("Golden Bamboo Lemur", "Scientists still don't understand how golden bamboo lemurs detoxify cyanide. Understanding this could lead to breakthroughs in treating cyanide poisoning in humans.", "bamboo_lemur.jpg", "science"),
            # Sportive Lemur
            ("Sportive Lemur", "Despite their name, sportive lemurs are among the least active primates, sleeping up to 18 hours a day to conserve energy on their low-calorie leaf diet.", "sportive_lemur.jpg", "behavior"),
            ("Sportive Lemur", "Sportive lemurs practice cecotrophy - they eat their own feces to extract additional nutrients, similar to rabbits. This lets them survive on leaves alone.", "sportive_lemur.jpg", "biology"),
            ("Sportive Lemur", "There are 26 recognized species of sportive lemur, the most species-rich genus of lemurs. Many were only distinguished through genetic analysis.", "sportive_lemur.jpg", "taxonomy"),
            ("Sportive Lemur", "Sportive lemurs sleep in tree holes during the day and are so sedentary that researchers can find the same individual in the same hole for months.", "sportive_lemur.jpg", "behavior"),
            # Eastern Woolly Lemur
            ("Eastern Woolly Lemur", "Eastern woolly lemurs form lifelong monogamous pair bonds, one of the few lemur species to do so. Partners sleep huddled together every day.", "woolly_lemur.jpg", "social"),
            ("Eastern Woolly Lemur", "Their dense, woolly fur acts like a natural insulation jacket, allowing them to thrive in cool mountain forests where temperatures can drop near freezing.", "woolly_lemur.jpg", "anatomy"),
            ("Eastern Woolly Lemur", "Woolly lemurs communicate through a variety of calls, including a distinctive 'avahy' sound that gives them their scientific genus name, Avahi.", "woolly_lemur.jpg", "behavior"),
            # Fork-marked Lemur
            ("Fork-marked Lemur", "Fork-marked lemurs are specialized gum-feeders with reinforced tooth combs that can gouge bark, allowing access to tree sap unavailable to other lemurs.", "fork_marked_lemur.jpg", "anatomy"),
            ("Fork-marked Lemur", "The distinctive dark stripe on a fork-marked lemur's face splits into a Y-shape on the forehead, giving the species its common name.", "fork_marked_lemur.jpg", "anatomy"),
            ("Fork-marked Lemur", "Fork-marked lemurs have an unusually large brain for their body size compared to other lemurs, possibly related to their complex foraging behavior.", "fork_marked_lemur.jpg", "anatomy"),
            # Diademed Sifaka
            ("Diademed Sifaka", "The diademed sifaka is often called the most beautiful of all lemurs, with silky fur in stunning patches of gold, white, grey, and black.", "diademed_sifaka.jpg", "anatomy"),
            ("Diademed Sifaka", "Diademed sifakas are one of the rarest lemurs, with fewer than 6,000-10,000 remaining. Habitat loss to slash-and-burn farming is their greatest threat.", "diademed_sifaka.jpg", "conservation"),
            ("Diademed Sifaka", "Diademed sifakas practice 'sunning' behavior - sitting on branches with arms spread wide to absorb warmth, looking like they're meditating.", "diademed_sifaka.jpg", "behavior"),
            ("Diademed Sifaka", "Unlike many lemurs, diademed sifakas rarely come to the ground. They spend almost their entire lives in the rainforest canopy, 20-30 meters above the forest floor.", "diademed_sifaka.jpg", "behavior"),
            # Black Lemur
            ("Black Lemur", "Black lemurs are one of the few lemur species that have adapted to living near humans, sometimes raiding crops and surviving in fragmented forest patches.", "black_lemur.jpg", "ecology"),
            ("Black Lemur", "On the island of Nosy Komba, black lemurs have become so habituated to tourists that they will climb onto visitors' shoulders to eat bananas.", "black_lemur.jpg", "behavior"),
            ("Black Lemur", "Male black lemurs are entirely jet black, while females are chestnut brown. Early scientists thought they were two different species.", "black_lemur.jpg", "anatomy"),
            # Mongoose Lemur
            ("Mongoose Lemur", "The mongoose lemur is one of only two lemur species found outside Madagascar - small populations live on the Comoros Islands, likely brought by ancient seafarers.", "mongoose_lemur.jpg", "ecology"),
            ("Mongoose Lemur", "Mongoose lemurs switch between being active during the day (wet season) and active at night (dry season), one of the few primates to shift their activity pattern.", "mongoose_lemur.jpg", "behavior"),
            ("Mongoose Lemur", "Mongoose lemurs have a mutualistic relationship with certain flowers - they are important pollinators of kapok and baobab trees while feeding on nectar.", "mongoose_lemur.jpg", "ecology"),
            # Pygmy Mouse Lemur
            ("Pygmy Mouse Lemur", "The pygmy mouse lemur is the smallest primate in the world by average body mass, weighing around 30 grams - less than a slice of bread.", "pygmy_mouse_lemur.jpg", "anatomy"),
            ("Pygmy Mouse Lemur", "Pygmy mouse lemurs were described in 1852 but then went missing for over 100 years, only being rediscovered in 1993 in western Madagascar.", "pygmy_mouse_lemur.jpg", "science"),
            ("Pygmy Mouse Lemur", "Despite their minuscule size, pygmy mouse lemurs are territorial and males will aggressively defend their feeding trees from rivals.", "pygmy_mouse_lemur.jpg", "behavior"),
            ("Pygmy Mouse Lemur", "A pygmy mouse lemur's heart beats up to 800 times per minute, but during torpor it can slow to just 8 beats per minute.", "pygmy_mouse_lemur.jpg", "biology"),
            # General Madagascar facts
            ("Ring-tailed Lemur", "All lemurs are endemic to Madagascar - they exist naturally nowhere else on Earth. They evolved in isolation for over 60 million years after Madagascar split from Africa.", "ring_tailed.jpg", "ecology"),
            ("Indri", "Over 100 species of lemur have been identified, making them the most diverse group of primates relative to the small area of Madagascar.", "indri.jpg", "taxonomy"),
            ("Mouse Lemur", "Lemurs arrived in Madagascar by rafting across the Mozambique Channel on floating vegetation approximately 60-70 million years ago.", "mouse_lemur.jpg", "science"),
            ("Aye-aye", "Over 90% of lemur species are threatened with extinction, making them the most endangered group of mammals on Earth.", "aye_aye.jpg", "conservation"),
        ]
        cur.executemany(
            "INSERT INTO lemur_facts (species, fact, image_filename, category) VALUES (?, ?, ?, ?)",
            facts,
        )
        print(f"Seeded {len(facts)} lemur facts.")

    # Seed quiz questions
    cur.execute("SELECT COUNT(*) FROM quiz_questions")
    if cur.fetchone()[0] == 0:
        questions = [
            ("Which lemur species is known for its 'stink fights'?", "Ring-tailed Lemur", "Aye-aye", "Indri", "Sifaka", "easy"),
            ("What is the largest living lemur species?", "Indri", "Red Ruffed Lemur", "Ring-tailed Lemur", "Diademed Sifaka", "easy"),
            ("Which lemur is the only primate known to truly hibernate?", "Fat-tailed Dwarf Lemur", "Mouse Lemur", "Sportive Lemur", "Eastern Woolly Lemur", "medium"),
            ("What continent is Madagascar located near?", "Africa", "Asia", "South America", "Australia", "easy"),
            ("How do sifakas cross open ground?", "Hopping sideways on hind legs", "Walking on all fours", "Rolling", "Crawling on their bellies", "easy"),
            ("Which lemur eats enough cyanide daily to kill a human?", "Golden Bamboo Lemur", "Aye-aye", "Fork-marked Lemur", "Ring-tailed Lemur", "medium"),
            ("What is unique about the blue-eyed black lemur's eyes?", "They have blue eyes like humans", "They glow in the dark", "They can see ultraviolet light", "They have rectangular pupils", "easy"),
            ("Which lemur species has never survived in captivity?", "Indri", "Ring-tailed Lemur", "Aye-aye", "Mouse Lemur", "medium"),
            ("What was the aye-aye first classified as when discovered?", "A rodent", "A bat", "A cat", "A monkey", "medium"),
            ("How long can a fat-tailed dwarf lemur hibernate?", "Up to 7 months", "Up to 2 weeks", "Up to 1 month", "Up to 3 months", "medium"),
            ("Which is the smallest primate in the world?", "Pygmy Mouse Lemur", "Mouse Lemur", "Fat-tailed Dwarf Lemur", "Fork-marked Lemur", "medium"),
            ("How far can indri songs be heard?", "Up to 3 kilometers", "Up to 100 meters", "Up to 500 meters", "Up to 10 kilometers", "medium"),
            ("What ecological role does the aye-aye fill in Madagascar?", "Woodpecker", "Eagle", "Bear", "Beaver", "hard"),
            ("How far can sifakas leap between trees?", "Up to 10 meters", "Up to 2 meters", "Up to 5 meters", "Up to 20 meters", "medium"),
            ("What percentage of lemur species are threatened with extinction?", "Over 90%", "About 50%", "About 25%", "About 75%", "hard"),
            ("When was the golden bamboo lemur discovered?", "1987", "1952", "1901", "2003", "hard"),
            ("What do sportive lemurs do to extract extra nutrients from leaves?", "Eat their own feces", "Ferment leaves in cheek pouches", "Soak leaves in water", "Chew leaves twice", "hard"),
            ("Which lemur species is found outside Madagascar?", "Mongoose Lemur", "Ring-tailed Lemur", "Indri", "Aye-aye", "hard"),
            ("How many species of mouse lemur are recognized?", "At least 25", "Just 1", "About 5", "About 10", "hard"),
            ("What is the Malagasy name for the indri?", "Babakoto", "Simpona", "Varika", "Maki", "hard"),
            ("How did lemurs originally arrive on Madagascar?", "Rafting on vegetation across the ocean", "Walking across a land bridge", "Swimming", "Carried by birds", "medium"),
            ("Which ruffed lemur species pollinates the traveller's tree?", "Black-and-white Ruffed Lemur", "Red Ruffed Lemur", "Ring-tailed Lemur", "Indri", "hard"),
            ("What unique behavior do crowned lemurs exhibit with millipedes?", "Rub them on fur as insect repellent", "Eat them as a delicacy", "Use them as toys", "Trade them with other lemurs", "hard"),
            ("How many beats per minute can a pygmy mouse lemur's heart slow to during torpor?", "8 beats per minute", "50 beats per minute", "100 beats per minute", "200 beats per minute", "hard"),
            ("What makes the fork-marked lemur's diet unusual?", "They specialize in tree gum and sap", "They eat only insects", "They eat only fruit", "They eat fish", "medium"),
        ]
        cur.executemany(
            """INSERT INTO quiz_questions
            (question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, difficulty)
            VALUES (?, ?, ?, ?, ?, ?)""",
            questions,
        )
        print(f"Seeded {len(questions)} quiz questions.")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
