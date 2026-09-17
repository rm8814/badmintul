import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => {
        const role = params.role === "venueOwner" ? "venueOwner" : "player";
        return {
          name: typeof params.name === "string" ? params.name : "Player",
          email: typeof params.email === "string" ? params.email.toLowerCase() : (() => { throw new Error("Email is required"); })(),
          role,
        };
      },
    }),
  ],
});
