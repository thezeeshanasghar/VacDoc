Recommended Changes in VaccineAPI Project for ProfileImage, SignatureImage to work in VacDoc

            // Add these two lines in DoctorController inside VaccineAPI Project
            // dbDoctor.ProfileImage=doctorDTO.ProfileImage;
            // dbDoctor.SignatureImage=doctorDTO.SignatureImage;
export NODE_OPTIONS=--openssl-legacy-provider
$env:NODE_OPTIONS="--openssl-legacy-provider"
ALTER TABLE `doctors` ADD `Nationality` TEXT NOT NULL;