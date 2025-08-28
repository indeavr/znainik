import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pageId } = req.query;
  
  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ error: 'Page ID is required' });
  }
  
  try {
    // Fetch the page content
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    // Extract and concatenate text content from blocks
    let content = '';
    
    for (const block of response.results) {
      if ('paragraph' in block) {
        const paragraphBlock = block as any;
        if (paragraphBlock.paragraph.rich_text.length > 0) {
          const text = paragraphBlock.paragraph.rich_text
            .map((textObj: any) => textObj.plain_text)
            .join('');
          content += text + '\n\n';
        }
      } else if ('heading_1' in block || 'heading_2' in block || 'heading_3' in block) {
        const headingBlock = block as any;
        const headingType = 'heading_1' in block ? 'heading_1' : 
                           'heading_2' in block ? 'heading_2' : 'heading_3';
        
        if (headingBlock[headingType].rich_text.length > 0) {
          const headingLevel = Number.parseInt(headingType.slice(-1), 10);
          const headingMarker = '#'.repeat(headingLevel);
          const text = headingBlock[headingType].rich_text
            .map((textObj: any) => textObj.plain_text)
            .join('');
          content += `${headingMarker} ${text}\n\n`;
        }
      }
    }
    
    return res.status(200).json({ content });
  } catch (err) {
    console.error('Error fetching from Notion:', err);
    return res.status(500).json({ error: 'Failed to fetch from Notion' });
  }
}