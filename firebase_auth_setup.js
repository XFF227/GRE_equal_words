const API_URL = "https://6885b254f52d34140f6a541d.mockapi.io/users";

// 注册
async function register(username, password) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, scoreDict: {}, wrongSet: [] })
    });
    const data = await res.json();
    return data;
}

// 登录（简单密码匹配）
async function login(username, password) {
    const res = await fetch(`${API_URL}?username=${username}`);
    const users = await res.json();
    const match = users.find(u => u.password === password);
    if (match) return match;
    else throw new Error("用户名或密码错误");
}

// 更新用户数据
async function updateUser(id, scoreDict, wrongSet) {
    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreDict, wrongSet })
    });
}
