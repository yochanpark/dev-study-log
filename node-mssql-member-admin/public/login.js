document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault(); // 폼 기본 제출을 막고 fetch로 보낸다

    const id = document.getElementById("id").value.trim();
    const pw = document.getElementById("pw").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pw }),
        });
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            setTimeout(() => (window.location.href = "board.html"), 600);
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("서버 오류로 로그인할 수 없습니다.", "error");
    }
});

// 상단에 잠깐 떴다 사라지는 알림
function showToast(message, type) {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    toast.style.backgroundColor = type === "success" ? "#4CAF50" : "#F44336";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
