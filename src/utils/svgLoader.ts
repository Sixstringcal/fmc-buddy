export async function loadSvg(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load SVG at "${path}": ${response.statusText}`);
    }
    return response.text();
}
