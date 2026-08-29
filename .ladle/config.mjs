/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/stories/**/*.stories.tsx',
  defaultStory: '',
  appendToHead: `
    <style>
      body { background: #0A0F1A; }
    </style>
  `,
};
