import { storage } from "../storage";
class MockRetrievalService {
    async retrieveAuthorities(query, k = 4) {
        // Get all authorities from storage
        const allAuthorities = await storage.getAuthorities();
        // Simple keyword-based matching for mock retrieval
        const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        // Score authorities based on keyword matches
        const scoredAuthorities = allAuthorities.map(authority => {
            const authText = `${authority.citation} ${authority.title} ${authority.content}`.toLowerCase();
            let score = 0;
            keywords.forEach(keyword => {
                // Weight different parts differently
                if (authority.citation.toLowerCase().includes(keyword))
                    score += 10;
                if (authority.title.toLowerCase().includes(keyword))
                    score += 5;
                if (authority.content.toLowerCase().includes(keyword))
                    score += 1;
                // Special scoring for specific terms
                if (keyword === 'startup' && authText.includes('195'))
                    score += 20;
                if (keyword === 'home' && authText.includes('280a'))
                    score += 20;
                if (keyword === 'office' && authText.includes('280a'))
                    score += 15;
                if (keyword === 'qbi' && authText.includes('199a'))
                    score += 20;
                if (keyword === 'qualified' && authText.includes('199a'))
                    score += 15;
                if (keyword === 'business' && authText.includes('199a'))
                    score += 10;
                if (keyword === 'deduction' && (authText.includes('195') || authText.includes('280a') || authText.includes('199a')))
                    score += 8;
                if (keyword === 'election' && authText.includes('195'))
                    score += 15;
                if (keyword === 'corp' && authText.includes('2553'))
                    score += 20;
            });
            return { authority, score };
        });
        // Sort by score and take top k results
        const topAuthorities = scoredAuthorities
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(item => item.authority);
        // If we don't have enough specific matches, add some general authorities
        if (topAuthorities.length < k) {
            const remaining = k - topAuthorities.length;
            const generalAuthorities = allAuthorities
                .filter(auth => !topAuthorities.some(top => top.id === auth.id))
                .slice(0, remaining);
            topAuthorities.push(...generalAuthorities);
        }
        return topAuthorities;
    }
    async searchAuthorities(sourceTypes = [], searchTerm = "") {
        const authorities = await storage.getAuthorities(sourceTypes);
        if (!searchTerm) {
            return authorities;
        }
        const term = searchTerm.toLowerCase();
        return authorities.filter(auth => auth.citation.toLowerCase().includes(term) ||
            auth.title.toLowerCase().includes(term) ||
            auth.content.toLowerCase().includes(term));
    }
}
export const mockRetrievalService = new MockRetrievalService();
