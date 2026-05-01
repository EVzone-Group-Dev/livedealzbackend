import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscoveryService {
  getAudienceTabs() {
    return [
      { key: 'chat', label: 'Chat', icon: 'chat' },
      { key: 'qa', label: 'Q&A', icon: 'help' },
      { key: 'polls', label: 'Polls', icon: 'chart' },
      { key: 'giveaways', label: 'Giveaways', icon: 'gift' },
    ];
  }

  getFilterMetadata() {
    return {
      shelves: [
        { key: 'beauty', label: 'Beauty' },
        { key: 'filters', label: 'Filters' },
        { key: 'ar', label: 'AR' },
        { key: 'background', label: 'Background' },
        { key: 'chroma', label: 'Chroma' },
        { key: 'gesture', label: 'Gesture' },
        { key: 'time', label: 'Time' },
      ],
      filters: {
        beauty: [
          { id: 'beauty-none', label: 'None' },
          { id: 'soft-glam', label: 'Soft Glam' },
          { id: 'radiance', label: 'Radiance' },
          { id: 'porcelain', label: 'Porcelain' },
          { id: 'clean-skin', label: 'Clean Skin' },
        ],
        filters: [
          { id: 'filter-none', label: 'None' },
          { id: 'classic', label: 'Classic' },
          { id: 'warm', label: 'Warm' },
          { id: 'cool', label: 'Cool' },
          { id: 'vintage', label: 'Vintage' },
          { id: 'cinematic', label: 'Cinematic' },
          { id: 'dramatic', label: 'Dramatic' },
          { id: 'dreamy', label: 'Dreamy' },
          { id: 'noir', label: 'Noir' },
          { id: 'neon', label: 'Neon' },
          { id: 'invert', label: 'Invert' },
        ],
        ar: [
          { id: 'ar-none', label: 'None' },
          { id: 'smooth-skin', label: 'Smooth Skin' },
          { id: 'teeth-whitening', label: 'Teeth Whitening' },
          { id: 'eye-enlarge', label: 'Eye Enlarge' },
          { id: 'slim-face', label: 'Slim Face' },
          { id: 'thin-nose', label: 'Thin Nose' },
          { id: 'long-chin', label: 'Long Chin' },
          { id: 'forehead', label: 'Forehead' },
          { id: 'blue-eyes', label: 'Blue Eyes' },
          { id: 'green-eyes', label: 'Green Eyes' },
          { id: 'amber-eyes', label: 'Amber Eyes' },
          { id: 'red-lips', label: 'Red Lips' },
          { id: 'pink-lips', label: 'Pink Lips' },
          { id: 'nude-lips', label: 'Nude Lips' },
          { id: 'ruby-hair', label: 'Ruby Hair' },
          { id: 'platinum-hair', label: 'Platinum Hair' },
          { id: 'midnight-hair', label: 'Midnight Hair' },
          { id: 'warm-skin', label: 'Warm Skin' },
          { id: 'cool-skin', label: 'Cool Skin' },
        ],
        background: [
          { id: 'background-none', label: 'None' },
          { id: 'blur-lite', label: 'Blur Lite' },
          { id: 'blur-medium', label: 'Blur Medium' },
          { id: 'blur-heavy', label: 'Blur Heavy' },
          { id: 'bg-bookshelf', label: 'Bookshelf' },
          { id: 'bg-goods-display', label: 'Goods Shelf' },
          { id: 'bg-home-office', label: 'Home Office' },
          { id: 'bg-city-loft', label: 'City Loft' },
          { id: 'bg-sunset-lounge', label: 'Sunset Lounge' },
          { id: 'bg-brand-wall', label: 'EVzone Brand' },
          { id: 'background-custom', label: 'Custom Upload' },
          { id: 'dim', label: 'Dim' },
          { id: 'black', label: 'Black' },
        ],
        chroma: [
          { id: 'chroma-off', label: 'Off' },
          { id: 'green-screen', label: 'Green Screen' },
          { id: 'blue-screen', label: 'Blue Screen' },
        ],
        gesture: [
          { id: 'gesture-off', label: 'Off' },
          { id: 'wave-magic', label: 'Wave Magic' },
          { id: 'hearts', label: 'Hearts' },
          { id: 'peace-split', label: 'Peace Split' },
          { id: 'slow-motion', label: 'Slow Motion' },
        ],
        time: [
          { id: 'time-normal', label: 'Normal' },
          { id: 'slow-0-5x', label: 'Slow 0.5x' },
          { id: 'slow-0-25x', label: 'Slow 0.25x' },
          { id: 'fast-2x', label: 'Fast 2x' },
          { id: 'fast-4x', label: 'Fast 4x' },
          { id: 'freeze', label: 'Freeze' },
          { id: 'motion-blur', label: 'Motion Blur' },
          { id: 'echo', label: 'Echo' },
        ],
      },
    };
  }

  getSceneTemplates() {
    return [
      { id: 'scene-1', name: 'Intro + host', sources: 4 },
      { id: 'scene-2', name: 'Single camera', sources: 2 },
      { id: 'scene-3', name: 'Product close-up', sources: 3 },
      { id: 'scene-4', name: 'Split screen', sources: 4 },
      { id: 'scene-5', name: 'Hero overlay', sources: 3 },
      { id: 'scene-6', name: 'Flash offer', sources: 5 },
      { id: 'scene-7', name: 'Offer graphic', sources: 2 },
    ];
  }

  getSourceOptions() {
    return [
      {
        id: 'camera',
        label: 'Camera',
        note: 'Webcam or capture device',
        icon: 'video',
      },
      {
        id: 'screen',
        label: 'Screen',
        note: 'Share screen or window',
        icon: 'monitor',
      },
      { id: 'image', label: 'Image', note: 'PNG, JPG, or GIF', icon: 'smartphone' },
      {
        id: 'text',
        label: 'Text',
        note: 'Text overlay or banner',
        icon: 'file-text',
      },
      { id: 'browser', label: 'Browser', note: 'URL webview', icon: 'globe' },
      { id: 'alert', label: 'Alert Box', note: 'Social notifications', icon: 'bell' },
      { id: 'product', label: 'Product', note: 'Product showcase', icon: 'bag' },
      { id: 'price', label: 'Price', note: 'Price tag', icon: 'cart' },
      { id: 'cta', label: 'CTA Button', note: 'Call to action', icon: 'broadcast' },
      { id: 'widget', label: 'Widget', note: 'Timer, stats, etc', icon: 'layout' },
    ];
  }
}
