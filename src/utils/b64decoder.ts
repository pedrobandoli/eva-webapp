export function downloadFile(contentType: 'application/xml' | 'application/json', text: string, filename: string) {
    const source = `data:${contentType};base64,${text}`
    const downloadLink = document.createElement('a')
    downloadLink.href = source
    downloadLink.download = filename.split('.')[0] + '_evaML'

    downloadLink.click()
}