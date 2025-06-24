export default function generateSlug(text: string){
    return text.trim()
    .replace(/\s+/g, ' ')       // normalize spaces
    .toLowerCase()
    .replace(/\s/g, '-')        // replace space with dash
    .replace(/[^a-z0-9\-]/g, ''); // remove non-alphanumerics
}