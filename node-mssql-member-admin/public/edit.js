document.addEventListener("DOMContentLoaded", function () {
    // 목록에서 edit.html?id=... 로 넘어온다. 처음엔 이 값을 안 넘겨 memberId가 null이었다.
    const memberId = new URLSearchParams(window.location.search).get("id");
    if (!memberId) {
        alert("잘못된 접근입니다.");
        window.location.href = "board.html";
        return;
    }

    fetch(`/api/member?id=${encodeURIComponent(memberId)}`)
        .then((response) => {
            if (!response.ok) throw new Error("서버 응답 오류");
            return response.json();
        })
        .then((data) => {
            document.getElementById("id").value = data.member.id;
            document.getElementById("name").value = data.member.name;
        })
        .catch(() => {
            alert("회원 정보를 불러올 수 없습니다.");
            window.location.href = "board.html";
        });

    document.getElementById("edit-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const body = {
            id: memberId,
            name: document.getElementById("name").value.trim(),
            password: document.getElementById("password").value,
        };
        if (!body.name || !body.password) return alert("이름과 비밀번호를 입력하세요.");

        const data = await post("/api/update-member", body);
        if (data.success) {
            alert("회원 정보가 수정되었습니다.");
            window.location.href = "board.html";
        } else {
            alert("수정 실패: " + data.message);
        }
    });

    document.getElementById("delete-btn").addEventListener("click", async function () {
        if (!confirm("정말로 삭제하시겠습니까?")) return;
        const data = await post("/api/delete-member", { id: memberId });
        if (data.success) {
            alert("회원이 삭제되었습니다.");
            window.location.href = "board.html";
        } else {
            alert("삭제 실패: " + data.message);
        }
    });

    document.getElementById("cancel-btn").addEventListener("click", () => {
        window.location.href = "board.html";
    });
});

async function post(url, body) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return await response.json();
    } catch (err) {
        return { success: false, message: "서버 오류" };
    }
}
