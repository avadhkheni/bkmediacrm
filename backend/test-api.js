async function main() {
  try {
    // Login
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bkmedia.in',
        password: 'Password123!'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // Get roles
    const rolesRes = await fetch('http://localhost:5000/api/v1/roles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const rolesData = await rolesRes.json();
    console.log(JSON.stringify(rolesData, null, 2));
  } catch (error) {
    console.error(error);
  }
}
main();
