document.getElementById("add-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const body = {
        id: document.getElementById("user-id").value.trim(),
        pw: document.getElementById("user-pw").value,
        name: document.getElementById("user-name").value.trim(),
    };
    if (!body.id || !body.pw || !body.name) return alert("모든 항목을 입력하세요.");

    try {
        const response = await fetch("/api/addUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.success) {
            alert("회원이 추가되었습니다.");
            window.location.href = "board.html";
        } else {
            alert("추가 실패: " + data.message);
        }
    } catch (err) {
        alert("서버 오류로 추가할 수 없습니다.");
    }
});

document.getElementById("cancel-btn").addEventListener("click", () => {
    window.location.href = "board.html";
});
