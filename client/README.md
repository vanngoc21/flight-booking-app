# Flight Booking client

Expo SDK 58 mobile client for the flight-booking API.

## Run on a phone

1. Use a Node.js release supported by Expo SDK 58 (22.13.x, 24.3.x, 26.x, or 27+; Node 25 is not supported).
2. Connect the phone and development computer to the same Wi-Fi network.
3. Set `EXPO_PUBLIC_API_URL` in `client/.env` to the computer's LAN address, not `localhost`:

   ```env
   EXPO_PUBLIC_API_URL=http://<computer-LAN-IP>:5000
   ```

4. Start MongoDB and Redis, then start the server from the `server` directory:

   ```bash
   npm start
   ```

5. On the phone, open `http://<computer-LAN-IP>:5000/api/health` in a browser and confirm it returns `"status":"ok"`.
6. Start Expo from the `client` directory and scan its QR code with Expo Go:

   ```bash
   npx expo start --lan
   ```

For Android builds that use the local HTTP API, the config plugin sets
`android:usesCleartextTraffic` for private-network API URLs. Native config changes
require rebuilding the development app; reloading JavaScript in an already
installed build is not sufficient. Production APIs should use HTTPS.

## Open the Admin portal on a phone

Start the Admin Vite server with `npm run dev -- --host 0.0.0.0` from `admin`,
then open `http://<computer-LAN-IP>:5173` on the phone. The Admin API client
replaces a localhost API host with the current browser host, and the development
server allows private-network origins on the Admin and Expo web ports.

Changing Wi-Fi networks may change the computer's LAN IP. Update `client/.env`
and restart Expo when that happens. Do not use the computer's `localhost` address
on a physical phone.

## Passenger details

The booking form collects each passenger's name, date of birth, nationality,
travel document, email, and phone number. Passport details include the issuing
country and expiry date. International routes require a valid passport; the
client and API determine this from the country configured for each airport.
Keep airport country data up to date in the Admin portal. Entry, visa, transit,
and document-validity requirements can vary by destination and airline, so
passengers should verify them with official sources before travel. The form
also accepts visa, visa-exemption, residence, or transit-document details when
applicable. Do not send identity or payment details to the AI chat. The
in-progress passenger form is kept in memory when returning to seat selection
and is cleared after booking; it is not written to local storage.

## Offline tickets

After payment is confirmed, open **Vé điện tử / QR** and tap **Thông tin vé
offline** to create a PNG ticket image. On a phone, the image is saved in the
app's documents and the share sheet lets you save or send it; on web, the PNG is
downloaded. The QR opens the ticket screen in the app. In Expo Go, keep the Expo
development server running and reachable from the scanning phone for that link
to work.
