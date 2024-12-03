export default function updatePromptText(prompt: string, imageStyle: string | undefined, brigtness: string | undefined, color:string | undefined ) : string {

    let addedText = 'Also, the image should have the following properties:\n';
    if (imageStyle) {
        addedText += `Image style: ${imageStyle}\n`;
    }
    if (brigtness) {
        addedText += `Brightness: ${brigtness}\n`;
    }
    if (color) {
        addedText += `Color: ${color}\n`;
    }
    const updatedPrompt = prompt + addedText;

    return updatedPrompt;
}