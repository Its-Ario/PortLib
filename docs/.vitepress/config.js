import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'PortLib',
    description: 'A Portable Library SPA',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Components', link: '/components/' },
            { text: 'API', link: '/api/' },
        ],

        sidebar: [
            {
                text: 'Getting Started',
                items: [{ text: 'Introduction', link: '/' }],
            },
            {
                text: 'Components',
                link: '/components/index',
                items: [
                    { text: 'app-view', link: '/components/app-view' },
                    { text: 'header-bar', link: '/components/header-bar' },
                    { text: 'login-view', link: '/components/login-view' },
                    { text: 'user-list', link: '/components/user-list' },
                    { text: 'user-map', link: '/components/user-map' },
                ],
            },
            {
                text: 'API',
                items: [
                    { text: 'Overview', link: '/api/' },
                    // { text: 'Auth', link: '/api/auth' },
                    // { text: 'Books', link: '/api/books' },
                    // { text: 'Users', link: '/api/users' },
                ],
            },
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/Its-Ario/PortLib' }],
    },
});
