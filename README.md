# Cocoon

An app that effortlessly transforms documents into smart, accessible insights. Upload or scan anything, and it quietly organizes the info, chats with you to reveal what matters, and nudges you when something needs attention—all with a clever, behind-the-scenes touch.

## Features

- Document upload and OCR processing
- Local-first storage for privacy
- Smart document organization with folders and tags
- Chat interface for document queries
- Expiry date notifications
- Mobile-responsive design

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- MongoDB
- IndexedDB for local storage
- Tesseract.js for OCR

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/cocoon
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Status

Currently in active development. Basic features implemented:
- Project structure and routing
- Document upload interface
- Responsive layout with sidebar
- Basic document organization structure

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
