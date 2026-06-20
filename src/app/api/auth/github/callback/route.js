import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/?error=no_code");
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect("/?error=token_failed");
    }

    // Get user info from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const githubUser = await userRes.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { githubId: String(githubUser.id) },
    });

    if (!user) {
      // Check if username already taken
      const existingUser = await prisma.user.findUnique({
        where: { username: githubUser.login },
      });

      const username = existingUser
        ? `${githubUser.login}_gh`
        : githubUser.login;

      user = await prisma.user.create({
        data: {
          username,
          password: "", // GitHub users don't need password
          githubId: String(githubUser.id),
          avatarUrl: githubUser.avatar_url,
          bio: githubUser.bio || "",
        },
      });
    } else {
      // Update avatar
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: githubUser.avatar_url },
      });
    }

    // Sign JWT
    const token = signToken(user.id);

    // Redirect to frontend with token (frontend will store it)
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("user", JSON.stringify({ id: user.id, username: user.username, avatarUrl: user.avatarUrl }));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect("/?error=oauth_failed");
  }
}
