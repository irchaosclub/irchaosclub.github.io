// contentlayer.config.ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from "rehype-slug";


export const Post = defineDocumentType(() => ({
    name: 'Post',
    filePathPattern: '**/*.md',
    contentType: 'markdown',
    fields: {
        title: { type: 'string', required: true },
        date: { type: 'date', required: true },
        authors: { type: 'list', of: { type: 'string' } },
        tags: { type: 'list', of: { type: 'string' } },
        description: { type: 'string' },
        readingTime: { type: 'number' },
        external: { type: 'string' },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.flattenedPath.replace(/\\/g, '/').replace(/\/index$/i, ''),
        },
    },
}))

export default makeSource({
    contentDirPath: 'content',
    documentTypes: [Post],
    markdown: {
        // Enable GFM features: tables, strikethrough, task lists, autolinks
        remarkPlugins: [remarkGfm as unknown as any],
        rehypePlugins: [rehypeHighlight as unknown as any, rehypeSlug as any],
    },
})
