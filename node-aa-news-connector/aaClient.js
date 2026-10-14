// Automation Anywhere Control Room API
//   POST /v2/authentication      { username, apiKey, multipleLogin } → { token }
//   POST /v4/automations/deploy  헤더 X-Authorization: token
// node-fetch v3는 ESM 전용이라 require()에서 ERR_REQUIRE_ESM이 났다 → Node 18+ 내장 fetch 사용

function createAaClient({ controlRoomUrl, username, apiKey, botId, automationName, fetchImpl = fetch }) {
    async function getAuthToken() {
        const res = await fetchImpl(`${controlRoomUrl}/v2/authentication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, apiKey, multipleLogin: true }),
        });
        if (!res.ok) throw new Error(`토큰 발급 실패: ${res.status}`);
        return (await res.json()).token;
    }

    async function deployBot(botInputData) {
        const token = await getAuthToken();
        const res = await fetchImpl(`${controlRoomUrl}/v4/automations/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
            body: JSON.stringify({
                botId,
                automationName,
                botInput: { dicInput: { type: 'DICTIONARY', dictionary: botInputData } },
            }),
        });
        if (!res.ok) throw new Error(`봇 실행 실패: ${res.status}`);
        return res.json();
    }

    return { getAuthToken, deployBot };
}

module.exports = { createAaClient };
