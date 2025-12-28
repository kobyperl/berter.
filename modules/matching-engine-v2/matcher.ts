
import { UserProfile, BarterOffer, SystemTaxonomy, TagMapping } from '../../types';

/**
 * Resolves a list of tags to their mapped Categories (Occupations) and Interests
 */
const resolveTags = (tags: string[], mapping: Record<string, TagMapping>): { categories: Set<string>, interests: Set<string> } => {
    const categories = new Set<string>();
    const interests = new Set<string>();

    tags.forEach(tag => {
        const map = mapping[tag];
        if (map && !map.isHidden) {
            if (map.mappedCategories) map.mappedCategories.forEach(c => categories.add(c));
            if (map.mappedInterests) map.mappedInterests.forEach(i => interests.add(i));
        }
    });

    return { categories, interests };
};

/**
 * Advanced Matching Algorithm for "Especially for You" feed.
 * 
 * Rules:
 * 1. Occupation Match (Professional):
 *    - User's Occupation matches Ad's NEED (receiving_tags).
 *    - Filter: User's Occupation must NOT match Ad's OFFER (giving_tags) (Competitor Check).
 * 
 * 2. Interest Match (Personal):
 *    - User's Interest matches Ad's OFFER (giving_tags).
 *    - OR User's Interest matches Ad's NEED (receiving_tags) (Shared Interest).
 */
export const isOfferRelevantForUser = (
    user: UserProfile, 
    offer: BarterOffer, 
    taxonomy: SystemTaxonomy
): boolean => {
    // 1. Basic Filters
    if (offer.status !== 'active') return false;
    if (offer.profileId === user.id) return false;

    const userOccupations = new Set([user.mainField, ...(user.secondaryFields || [])].filter(Boolean));
    const userInterests = new Set(user.interests || []);
    
    // Resolve Offer Tags
    // We prefer specific arrays if available, otherwise fallback to generic tags
    const offerGivingTags = offer.giving_tags && offer.giving_tags.length > 0 ? offer.giving_tags : offer.tags;
    const offerReceivingTags = offer.receiving_tags && offer.receiving_tags.length > 0 ? offer.receiving_tags : offer.tags;

    const mapping = taxonomy.tagMappings || {};

    const givingResolved = resolveTags(offerGivingTags, mapping);
    const receivingResolved = resolveTags(offerReceivingTags, mapping);

    // --- RULE 1: Occupation Based (Professional) ---
    // User is a [Web Dev]. Does the offer NEED a [Web Dev]?
    const isProfessionalMatch = Array.from(userOccupations).some(userOcc => {
        // Does the offer need this occupation?
        // Check 1: Direct string match in mapped categories of receiving tags
        const needsOccupation = receivingResolved.categories.has(userOcc);
        
        // Competitor Check: Does the offer GIVE this occupation?
        const isCompetitor = givingResolved.categories.has(userOcc);

        return needsOccupation && !isCompetitor;
    });

    if (isProfessionalMatch) return true;

    // --- RULE 2: Interest Based (Personal) ---
    const isInterestMatch = Array.from(userInterests).some(userInt => {
        // Case A: Offer GIVES something I'm interested in (e.g., I like Guitar, Offer gives Guitar Lessons)
        const offersInterest = givingResolved.interests.has(userInt);
        
        // Case B: Offer WANTS something I'm interested in (Shared Interest / Group)
        const wantsInterest = receivingResolved.interests.has(userInt);

        // Direct tag match fallback (if not mapped yet)
        const rawTagMatch = offerGivingTags.includes(userInt) || offerReceivingTags.includes(userInt);

        return offersInterest || wantsInterest || rawTagMatch;
    });

    if (isInterestMatch) return true;

    return false;
};
