import html2canvas from 'html2canvas';
import { supabase } from "./supabase";
import QRCode from 'qrcode';

// Helper to fill variables in text
export function fillCardVariables(text: string, guest: any, event: any, eventAttributes: any[] = []) {
  const cardTypeValue = guest.card_type || '';
  console.log('[fillCardVariables]', {
    guestName: guest.name,
    guestCardType: guest.card_type,
    cardTypeValue,
    originalText: text
  });
  
  let filledText = text
    .replace(/\{\{guest_name\}\}/g, guest.name)
    .replace(/\{\{event_name\}\}/g, event.name)
    .replace(/\{\{event_date\}\}/g, event.date)
    .replace(/\{\{event_time\}\}/g, event.time)
    .replace(/\{\{event_venue\}\}/g, event.venue)
    .replace(/\{\{plus_one_name\}\}/g, guest.plus_one_name || "")
    .replace(/\{\{card_type\}\}/g, cardTypeValue)
    .replace(/\{\{qr_code\}\}/g, guest.id);
  
  console.log('[fillCardVariables] After replacement:', filledText);

  // Replace event attribute variables
  eventAttributes.forEach(attr => {
    const regex = new RegExp(`\\{\\{${attr.attribute_key}\\}\\}`, 'g');
    filledText = filledText.replace(regex, attr.attribute_value || '');
  });

  return filledText;
}

// Render the card DOM for a guest (hidden)
export async function renderCardDOM(
  cardDesign: any,
  guest: any,
  event: any,
  eventAttributes: any[] = []
): Promise<HTMLDivElement> {
  return new Promise((resolve) => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.left = "-9999px";
    div.style.top = "0";
    div.style.width = `${cardDesign.canvas_width}px`;
    div.style.height = `${cardDesign.canvas_height}px`;
    div.style.background = "#fff";
    div.style.backgroundImage = cardDesign.background_image
      ? `url(${cardDesign.background_image})`
      : "none";
    div.style.backgroundSize = "cover";
    div.style.backgroundPosition = "center";
    div.style.overflow = "hidden";
    div.style.zIndex = "-1";

    // Add text/QR elements
    for (const element of cardDesign.text_elements) {
      const el = document.createElement("div");
      el.style.position = "absolute";
      el.style.left = `${element.x}px`;
      el.style.top = `${element.y}px`;
      el.style.fontSize = `${element.fontSize}px`;
      el.style.fontFamily = element.fontFamily;
      el.style.color = element.color;
      el.style.fontWeight = element.fontWeight;
      el.style.fontStyle = element.fontStyle;
      el.style.textDecoration = element.textDecoration;
      el.style.textAlign = element.textAlign;
      el.style.minWidth = "100px";
      el.style.padding = "4px";
      if (element.type === "qr_code") {
        // Render a real QR code image
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = element.width || 100;
        qrCanvas.height = element.height || 100;
        QRCode.toCanvas(qrCanvas, guest.id, { width: qrCanvas.width, margin: 0 }, (error: Error | null | undefined) => {
          if (error) console.error(error);
        });
        el.appendChild(qrCanvas);
      } else {
        el.innerText = fillCardVariables(element.text, guest, event, eventAttributes);
      }
      div.appendChild(el);
    }

    document.body.appendChild(div);
    setTimeout(() => resolve(div), 100); // Wait for DOM
  });
}

// Export card as image and upload to Supabase Storage
export async function generateCardImageForGuest(
  cardDesign: any,
  guest: any,
  event: any,
  eventAttributes: any[] = []
): Promise<string> {
  console.log('[generateCardImageForGuest] Guest data:', {
    id: guest.id,
    name: guest.name,
    card_type: guest.card_type,
    card_count: guest.card_count,
    fullGuestObject: guest
  });
  
  const dom = await renderCardDOM(cardDesign, guest, event, eventAttributes);
  
  // Use high scale for quality without setting explicit dimensions
  const canvas = await html2canvas(dom, {
    useCORS: true,
    scale: 3,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
    foreignObjectRendering: false
  });
  
  // Export at highest quality
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  document.body.removeChild(dom);

  try {
    // Try to upload to Supabase Storage
    const fileName = `cards/${event.id}/${guest.id}_${Date.now()}.png`;
    const blob = await (await fetch(dataUrl)).blob();
    
    const { data, error } = await supabase.storage
      .from("card-images")
      .upload(fileName, blob, { upsert: true, contentType: "image/png" });
    
    if (error) {
      console.warn('Failed to upload to Supabase Storage:', error);
      console.log('Using data URL as fallback');
      return dataUrl; // Return data URL as fallback
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("card-images")
      .getPublicUrl(fileName);
    return publicData.publicUrl;
  } catch (error) {
    console.warn('Error uploading to Supabase Storage:', error);
    console.log('Using data URL as fallback');
    return dataUrl; // Return data URL as fallback
  }
}
 