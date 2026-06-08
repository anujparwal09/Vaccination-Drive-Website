const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { readJson: readJsonFile, writeJson: writeJsonFile, appendJson } = require("../utils/jsonStorage");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.CLIENT_URL || "http://localhost:5173";

const isGoogleOAuthConfigured = Boolean(googleClientId && googleClientSecret);

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account did not provide an email address."), null);
          }

          const users = await readJsonFile("users.json");
          let user = users.find((u) => u.googleId === profile.id);

          if (user) {
            return done(null, user);
          }

          user = users.find((u) => u.email.toLowerCase() === email);

          if (user) {
            user.googleId = profile.id;
            if (profile.photos?.length > 0 && !user.profileImage) {
              user.profileImage = profile.photos[0].value;
            }
            user.isVerified = true;
            user.updatedAt = new Date().toISOString();

            const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
            await writeJsonFile("users.json", updatedUsers, { logMessage: "Google Account Linked" });
            return done(null, user);
          }

          const newUserId = "USR" + Math.floor(1000 + Math.random() * 9000);
          user = {
            id: newUserId,
            fullName: profile.displayName || "Google User",
            email,
            password: "",
            phone: "",
            profileImage: profile.photos?.length > 0
              ? profile.photos[0].value
              : `https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser${Math.floor(Math.random() * 10000)}`,
            role: "user",
            isVerified: true,
            googleId: profile.id,
            refreshToken: "",
            verificationToken: "",
            resetPasswordToken: "",
            resetPasswordExpires: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await appendJson("users.json", user, { logMessage: "Google User Registered" });
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

passport.isGoogleOAuthConfigured = isGoogleOAuthConfigured;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await readJsonFile("users.json");
    const user = users.find((u) => u.id === id);
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
