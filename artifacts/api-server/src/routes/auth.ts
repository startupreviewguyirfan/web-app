import { Router, type IRouter } from "express";
import passport from "passport";

const router: IRouter = Router();

// Get current session info
router.get("/auth/session", (req, res): void => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      authenticated: true,
      user: {
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Start Google OAuth flow
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/?auth=failed" }),
  (_req, res): void => {
    res.redirect("/admin-access");
  },
);

// Logout
router.post("/auth/logout", (req, res): void => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
});

export default router;
