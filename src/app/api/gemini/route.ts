import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');

    console.log('Received request:', { 
      hasFile: !!file, 
      fileType: file instanceof Blob ? file.type : typeof file,
      documentType 
    });

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType || typeof documentType !== 'string') {
      return NextResponse.json({ error: 'Document type not provided' }, { status: 400 });
    }

    // Convert file to bytes
    const bytes = await file.arrayBuffer();

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const prompt = `This is a ${documentType}. Please analyze it and extract all relevant information. Return your analysis as a JSON object where the keys are field names and values are the extracted information. Include a "text" field with all raw text found in the image.`;

    // Create the image part for the model
    const imagePart = {
      inlineData: {
        data: Buffer.from(bytes).toString('base64'),
        mimeType: file.type
      }
    };

    console.log('Sending request to Gemini with prompt:', prompt);

    // Generate content with the image
    const response = await model.generateContent([prompt, imagePart]);
    const result = response.response;
    const text = result.text();
    
    console.log('Received response from Gemini:', text);

    // Try to parse the response as JSON
    let data;
    try {
      // First try parsing as direct JSON
      data = JSON.parse(text);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }

    // Extract text and metadata
    const { text: extractedText, ...metadata } = data;

    return NextResponse.json({
      text: extractedText,
      metadata
    });
  } catch (error: unknown) {
    console.error('Gemini API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process image'
    }, { status: 500 });
  }
} 