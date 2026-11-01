# Welcome to our GDSC Chapter page

A complete solution for handling everything about our **GDSC** for its members and organizers. On our campus, **[Bengal Institute of Technology](https://bitcollege.in)**, we have the honour to establish **[Google Developer Students Club](https://gdsc.community.dev)** for the first time. We love to see students and tech professionals are joining it and exploring their potential.

## Have a look...

![home page](client/public/readme_img/home.png)

**_view of home page_**

![socials section](client/public//readme_img/socials.png)

**_socials section_**

## Features

- Designed to the official **GDG On Campus brand guide**, with a light / dark theme switch and mobile-first layouts.
- **Events, team and projects stay up to date automatically**: events and organizers are synced from our
  [GDG community page](https://gdg.community.dev/gdg-on-campus-bengal-institute-of-technology-kolkata-india/),
  projects from the [GDGOCBIT GitHub org](https://github.com/GDGOCBIT).
- **Admin dashboard** (`/admin`) to add events, team members, projects and certificates (with CSV import).
  Admins are the emails listed in `ADMIN_EMAILS`.
- Member accounts: email + OTP sign-up, Google / LinkedIn / X sign-in, profile editing.
- Certificate verification with share and download options.

## Running locally

```bash
cp .env.example .env            # fill in the values
echo "VITE_SECRET_KEY=<same as DATA_ENCRYPTION_SECRET_KEY>" > client/.env
npm install && (cd client && npm install)
npm run dev                     # API on http://localhost:5000
npm run client                  # site on http://localhost:5173
```

### Certificate Verification
The most useful feature which help us a lot to verify certificates shared to individuals appreciating effort.

![certificate verification page](client/public/readme_img/cert_template.png)

***view of a verified certificate***
- View your certificate on our site.
- Share your achievement on socials.
- Download it if unable to find in your gallery.

### Sign in to personalize

![sing in page image](client/public/readme_img/user_auth.png)

***user sign up and login page***
- View your events related data, scoreboard, and contributions.
- Look and change your information saved with us.


## For Developers
We  have made it open source to help **GDSCs** around the globe. We are also looking forward for developers to come and contribute into. Please, read following sections to make it easier for you.
### Interface for devs
1. Fork and repo and clone the forked on local machine.
2. Go through contributing guidelines mentioned in [contribution guide](CONTRIBUTING.md).
3. Please adhere to our code of conduct through out interactions with this organization and  community members.
4. Chill !! Have a good one.