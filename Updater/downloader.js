export function download() {
    fetch('/githubdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('hellya')
    }).catch(() => {});
}

export function get() {
    fetch('/githubrec', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('hellya')
    })
    .then((response) => {
        if (!response.ok) {
            return null;
        }
        return response.json();
    })
    .catch(() => {})
}