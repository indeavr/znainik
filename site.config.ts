import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '191d629f9cd280f395f3c663e216be68',
  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: 'Azaira Znainik',
  domain: 'znainik.azaira.bg',
  author: 'MarDaRaTin',

  // open graph metadata (optional)
  description: 'Библиотека с Есенции',

  // social usernames (optional)
  // twitter: 'indeavr',
  // github: 'indeavr',
  // linkedin: 'donevskimartin',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: '/logo/logo-circle.png',
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  // Use Notion page “Slug” property for friendly paths like "/fest".
  // If a page has Slug = "fest", it will resolve automatically without overrides.

  // whether to use the default notion navigation style or a custom one with links to
  // important pages. To use `navigationLinks`, set `navigationStyle` to `custom`.
  // navigationStyle: 'default'
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: 'Азайра',
      url: 'https://azaira.bg'
    },
    // {
    //   title: 'Contact',
    //   pageId: '6a29ebcb935a4f0689fe661ab5f3b8d1'
    // }
  ],

  // Приказки — hub страница в Notion с вградени linked view на базите за
  // епизоди (и по желание приказки). Сподели я в интернет и постави id-то тук.
  // storiesNotionPageId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // База за епизоди (по избор; иначе се открива автоматично от hub-а):
  // storiesEpisodesCollectionId: '329d629f9cd2806f85e3000b14c38421'
})
