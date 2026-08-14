// Test script using Node's native fetch API (available in Node.js 18+)
async function testAuth() {
  console.log("=== BẮT ĐẦU KIỂM TRA LUỒNG AUTHENTICATION ===");
  const baseUrl = "http://localhost:3000/api";

  try {
    // 1. Test Login
    console.log("\n1. Đăng nhập với SV001 / 123456...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sv001@gmail.com",
        password: "123456",
      }),
    });

    const loginData = await loginRes.json();
    console.log("Status:", loginRes.status);
    console.log("Response:", JSON.stringify(loginData, null, 2));

    if (!loginRes.ok) {
      throw new Error("Đăng nhập thất bại!");
    }

    const accessToken = loginData.data.accessToken;
    const rawCookies = loginRes.headers.get("set-cookie");
    console.log("Set-Cookie Header:", rawCookies);

    // Parse refresh token from cookie
    let refreshToken = "";
    if (rawCookies) {
      const match = rawCookies.match(/refreshToken=([^;]+)/);
      if (match) refreshToken = match[1];
    }
    console.log("Parsed Refresh Token:", refreshToken);

    // 2. Test Get Me (Protected Route)
    console.log("\n2. Gọi API GET /auth/me bằng Access Token...");
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const meData = await meRes.json();
    console.log("Status:", meRes.status);
    console.log("Response:", JSON.stringify(meData, null, 2));

    // 3. Test Refresh Token
    console.log("\n3. Gọi API POST /auth/refresh để lấy cặp token mới...");
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    console.log("Status:", refreshRes.status);
    console.log("Response:", JSON.stringify(refreshData, null, 2));

    if (!refreshRes.ok) {
      throw new Error("Làm mới token thất bại!");
    }

    const newAccessToken = refreshData.data.accessToken;
    const newRawCookies = refreshRes.headers.get("set-cookie");
    let newRefreshToken = "";
    if (newRawCookies) {
      const match = newRawCookies.match(/refreshToken=([^;]+)/);
      if (match) newRefreshToken = match[1];
    }

    // 4. Test GET /auth/me with new Access Token
    console.log("\n4. Gọi API GET /auth/me bằng Access Token MỚI...");
    const newMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
    const newMeData = await newMeRes.json();
    console.log("Status:", newMeRes.status);
    console.log("Response:", JSON.stringify(newMeData, null, 2));

    // 5. Test Logout
    console.log("\n5. Đăng xuất...");
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${newRefreshToken}`,
      },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    const logoutData = await logoutRes.json();
    console.log("Status:", logoutRes.status);
    console.log("Response:", JSON.stringify(logoutData, null, 2));

    // 6. Test GET /auth/me after logout (Should fail)
    console.log("\n6. Thử gọi API GET /auth/me sau khi đã logout...");
    const failMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
    // Lưu ý: do Access Token là stateless, nếu server chưa hết 15m thì token vẫn verify qua JWT signature được,
    // TUY NHIÊN trong middleware protect, chúng ta check DB xem student có tồn tại không. Vì ta không revoke
    // access token (stateless), access token vẫn có thể hợp lệ cho đến khi hết hạn.
    // Hãy kiểm tra xem response trả về thế nào.
    const failMeData = await failMeRes.json();
    console.log("Status:", failMeRes.status);
    console.log("Response:", JSON.stringify(failMeData, null, 2));

    console.log("\n=== KIỂM TRA HOÀN TẤT ===");
  } catch (error) {
    console.error("Lỗi trong quá trình kiểm tra:", error);
  }
}

testAuth();
