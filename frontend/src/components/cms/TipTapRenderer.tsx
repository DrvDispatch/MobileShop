"use client";

import React from 'react';

/**
 * TipTap JSON Content Renderer
 * 
 * Renders TipTap editor JSON output as HTML.
 * Supports common node types: doc, paragraph, text, heading, bulletList, orderedList, listItem, blockquote, codeBlock, hardBreak, horizontalRule
 */

interface TipTapNode {
    type: string;
    content?: TipTapNode[];
    text?: string;
    marks?: { type: string; attrs?: Record<string, unknown> }[];
    attrs?: Record<string, unknown>;
}

interface TipTapRendererProps {
    content: TipTapNode | object | null | undefined;
    className?: string;
}

export function TipTapRenderer({ content, className = '' }: TipTapRendererProps) {
    if (!content || typeof content !== 'object') {
        return null;
    }

    const node = content as TipTapNode;

    return (
        <div className={`prose prose-zinc max-w-none ${className}`}>
            {renderNode(node)}
        </div>
    );
}

function renderNode(node: TipTapNode): React.ReactNode {
    if (!node) return null;

    switch (node.type) {
        case 'doc':
            return node.content?.map((child, index) => (
                <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
            ));

        case 'paragraph':
            return (
                <p className="mb-4 leading-relaxed text-zinc-600">
                    {node.content?.map((child, index) => (
                        <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                    ))}
                </p>
            );

        case 'heading':
            const level = (node.attrs?.level as number) || 1;
            const headingClasses: Record<number, string> = {
                1: 'text-3xl font-bold text-zinc-900 mb-6',
                2: 'text-2xl font-bold text-zinc-900 mb-4 mt-8',
                3: 'text-xl font-semibold text-zinc-900 mb-3 mt-6',
                4: 'text-lg font-semibold text-zinc-900 mb-2 mt-4',
                5: 'text-base font-semibold text-zinc-900 mb-2 mt-4',
                6: 'text-sm font-semibold text-zinc-900 mb-2 mt-4',
            };
            const headingContent = node.content?.map((child, index) => (
                <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
            ));

            switch (level) {
                case 1: return <h1 className={headingClasses[1]}>{headingContent}</h1>;
                case 2: return <h2 className={headingClasses[2]}>{headingContent}</h2>;
                case 3: return <h3 className={headingClasses[3]}>{headingContent}</h3>;
                case 4: return <h4 className={headingClasses[4]}>{headingContent}</h4>;
                case 5: return <h5 className={headingClasses[5]}>{headingContent}</h5>;
                case 6: return <h6 className={headingClasses[6]}>{headingContent}</h6>;
                default: return <h3 className={headingClasses[3]}>{headingContent}</h3>;
            }

        case 'bulletList':
            return (
                <ul className="list-disc list-inside mb-4 space-y-2 text-zinc-600">
                    {node.content?.map((child, index) => (
                        <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                    ))}
                </ul>
            );

        case 'orderedList':
            return (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-zinc-600">
                    {node.content?.map((child, index) => (
                        <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                    ))}
                </ol>
            );

        case 'listItem':
            return (
                <li>
                    {node.content?.map((child, index) => (
                        <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                    ))}
                </li>
            );

        case 'blockquote':
            return (
                <blockquote className="border-l-4 border-zinc-300 pl-4 my-4 text-zinc-600 italic">
                    {node.content?.map((child, index) => (
                        <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                    ))}
                </blockquote>
            );

        case 'codeBlock':
            return (
                <pre className="bg-zinc-100 rounded-lg p-4 overflow-x-auto mb-4">
                    <code className="text-sm text-zinc-800 font-mono">
                        {node.content?.map((child) => child.text).join('')}
                    </code>
                </pre>
            );

        case 'horizontalRule':
            return <hr className="my-8 border-zinc-200" />;

        case 'hardBreak':
            return <br />;

        case 'text':
            let textElement: React.ReactNode = node.text || '';

            // Apply marks (bold, italic, link, etc.)
            if (node.marks) {
                for (const mark of node.marks) {
                    switch (mark.type) {
                        case 'bold':
                            textElement = <strong className="font-semibold">{textElement}</strong>;
                            break;
                        case 'italic':
                            textElement = <em>{textElement}</em>;
                            break;
                        case 'underline':
                            textElement = <u>{textElement}</u>;
                            break;
                        case 'strike':
                            textElement = <s>{textElement}</s>;
                            break;
                        case 'code':
                            textElement = (
                                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-800">
                                    {textElement}
                                </code>
                            );
                            break;
                        case 'link':
                            textElement = (
                                <a
                                    href={mark.attrs?.href as string}
                                    target={mark.attrs?.target as string || '_blank'}
                                    rel="noopener noreferrer"
                                    className="text-violet-600 hover:text-violet-800 underline"
                                >
                                    {textElement}
                                </a>
                            );
                            break;
                    }
                }
            }

            return textElement;

        default:
            // Unknown node type - try to render children if they exist
            if (node.content) {
                return node.content.map((child, index) => (
                    <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
                ));
            }
            return null;
    }
}

/**
 * Simple plain text to TipTap JSON converter
 * Used when we need to convert textarea content to TipTap format
 */
export function textToTipTap(text: string): TipTapNode {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return {
        type: 'doc',
        content: paragraphs.length > 0
            ? paragraphs.map(p => ({
                type: 'paragraph',
                content: [{ type: 'text', text: p.trim() }]
            }))
            : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
    };
}

/**
 * Extract plain text from TipTap JSON
 */
export function tipTapToText(doc: TipTapNode | object): string {
    const extractText = (node: TipTapNode): string => {
        if (!node) return '';
        if (node.type === 'text') return node.text || '';
        if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join(node.type === 'paragraph' ? '\n\n' : '');
        }
        return '';
    };
    return extractText(doc as TipTapNode).trim();
}
