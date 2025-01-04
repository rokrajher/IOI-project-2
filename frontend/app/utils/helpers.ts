export default function updatePromptText(prompt: string, imageStyle: string | undefined, brigtness: string | undefined, color:string | undefined ) : string {

    let addedText = 'Generated image should have the following properties\n';
    if (imageStyle) {
        addedText += `Image style should be ${imageStyle}\n.`;
    }
    if (brigtness) {
        addedText += `Brightness of the image should be ${brigtness}\n.`;
    }
    if (color) {
        addedText += `The color of the image should be ${color}\n.`;
    }
    const updatedPrompt =  addedText + prompt;

    return updatedPrompt;
}