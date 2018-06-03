module.exports = {
    siteMetadata: {
        url: 'https://lumen.netlify.com',
        title: 'Blog by Peter Dol',
        subtitle: 'A blog about .net core and full stack web development.',
        copyright: '© All rights reserved.',
        disqusShortname: '',
        menu: [{
                label: 'Articles',
                path: '/'
            },
            {
                label: 'About me',
                path: '/about/'
            },
            {
                label: 'Contact me',
                path: '/contact/'
            }
        ],
        author: {
            name: 'Peter Dol',
            email: 'peterdol@gmail.com',
            telegram: '#',
            twitter: '#',
            github: '#',
            rss: '#',
            vk: '#'
        }
    },
    plugins: [{
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [{
                    resolve: `gatsby-remark-prismjs`,
                    options: {
                        // Class prefix for <pre> tags containing syntax highlighting;
                        // defaults to 'language-' (eg <pre class="language-js">).
                        // If your site loads Prism into the browser at runtime,
                        // (eg for use with libraries like react-live),
                        // you may use this to prevent Prism from re-processing syntax.
                        // This is an uncommon use-case though;
                        // If you're unsure, it's best to use the default value.
                        classPrefix: "language-",
                        // This is used to allow setting a language for inline code
                        // (i.e. single backticks) by creating a separator.
                        // This separator is a string and will do no white-space
                        // stripping.
                        // A suggested value for English speakers is the non-ascii
                        // character '›'.
                        inlineCodeMarker: null,
                        // This lets you set up language aliases.  For example,
                        // setting this to '{ sh: "bash" }' will let you use
                        // the language "sh" which will highlight using the
                        // bash highlighter.
                        aliases: {},
                    },
                }, ],
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: `${__dirname}/src/pages`,
                name: 'pages'
            }
        },
        {
            resolve: 'gatsby-plugin-feed',
            options: {
                query: `
          {
            site {
              siteMetadata {
                site_url: url
                title
                description: subtitle
              }
            }
          }
        `,
                feeds: [{
                    serialize: ({
                        query: {
                            site,
                            allMarkdownRemark
                        }
                    }) => (
                        allMarkdownRemark.edges.map(edge =>
                            Object.assign({}, edge.node.frontmatter, {
                                description: edge.node.frontmatter.description,
                                date: edge.node.frontmatter.date,
                                url: site.siteMetadata.site_url + edge.node.fields.slug,
                                guid: site.siteMetadata.site_url + edge.node.fields.slug,
                                custom_elements: [{
                                    'content:encoded': edge.node.html
                                }]
                            }))
                    ),
                    query: `
              {
                allMarkdownRemark(
                  limit: 1000,
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter: { frontmatter: { layout: { eq: "post" }, draft: { ne: true } } }
                ) {
                  edges {
                    node {
                      html
                      fields {
                        slug
                      }
                      frontmatter {
                        title
                        date
                        layout
                        draft
                        description
                      }
                    }
                  }
                }
              }
            `,
                    output: '/rss.xml'
                }]
            }
        },
        {
            resolve: 'gatsby-transformer-remark',
            options: {
                plugins: [{
                        resolve: 'gatsby-remark-images',
                        options: {
                            maxWidth: 960
                        }
                    },
                    {
                        resolve: 'gatsby-remark-responsive-iframe',
                        options: {
                            wrapperStyle: 'margin-bottom: 1.0725rem'
                        }
                    },
                    'gatsby-remark-prismjs',
                    'gatsby-remark-copy-linked-files',
                    'gatsby-remark-smartypants'
                ]
            }
        },
        'gatsby-transformer-sharp',
        'gatsby-plugin-sharp',
        {
            resolve: 'gatsby-plugin-google-analytics',
            options: {
                trackingId: 'UA-73379983-2'
            }
        },
        {
            resolve: `gatsby-plugin-google-fonts`,
            options: {
                fonts: [`roboto\:400,400i,500,700`]
            }
        },
        {
            resolve: 'gatsby-plugin-sitemap',
            options: {
                query: `
            {
              site {
                siteMetadata {
                  url
                }
              }
              allSitePage(
                filter: {
                  path: { regex: "/^(?!/404/|/404.html|/dev-404-page/)/" }
                }
              ) {
                edges {
                  node {
                    path
                  }
                }
              }
          }`,
                output: '/sitemap.xml',
                serialize: ({
                        site,
                        allSitePage
                    }) =>
                    allSitePage.edges.map((edge) => {
                        return {
                            url: site.siteMetadata.url + edge.node.path,
                            changefreq: 'daily',
                            priority: 0.7
                        };
                    })
            }
        },
        'gatsby-plugin-offline',
        'gatsby-plugin-catch-links',
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-postcss-sass'
    ]
};