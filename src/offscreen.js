chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.play) {
        const { source, volume } = message.play;
        const audio = new Audio(source);
        audio.volume = volume;
        audio.play()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // 非同期応答を示すために true を返す
    }
});
