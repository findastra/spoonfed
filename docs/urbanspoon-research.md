# Urbanspoon research for Spoonfed

Research date: October 8, 2026. Purpose: preserve the restaurant-discovery experience in a new product with original Spoonfed branding.

## What made the original work

Urbanspoon reduced the decision to a playful action: choose what matters, leave the rest open, and receive a restaurant suggestion. Its first iPhone interface used three slot-machine reels for location/neighborhood, cuisine, and price. Users could lock any subset and shake the phone to randomize the rest; a button provided the same interaction. [2008 description](https://www.macrumors.com/2008/07/19/urbanspoon-finds-you-a-place-to-eat/), [2008 hands-on account](https://www.macworld.com/article/191946/apps_travel.html)

| Verified feature | Evidence and relevance |
| --- | --- |
| Like/Dislike ratings, displayed as percentages | Zomato documented converting these into its five-point scale. Retain this approachable approval style if Spoonfed later collects its own votes. [Migration announcement](https://www.zomato.com/blog/urbanspoon-to-zomato-d-day-2-of-4/) |
| Restaurant detail pages | The developer listing includes distance, cuisine, contact information, directions, opening hours, menus, photos, and reservations. [App Store listing](https://apps.apple.com/us/app/urbanspoon-restaurant-food-reviews/id284708449) |
| Browse and interactive map | The 2012 redesign offered filters for cuisine, distance, name, popularity, and price, plus a movable map pin for exploring other areas. [Urbanspoon announcement](https://www.prnewswire.com/news-releases/urbanspoon-revamps-app-to-go-beyond-the-shake-users-can-discover-restaurants-based-on-personal-filters-expert-content-144595495.html) |
| Wishlist and editorial discovery | The same redesign included saved places, proximity alerts for signed-in users, and lists from food writers and award organizations. [Urbanspoon announcement](https://www.prnewswire.com/news-releases/urbanspoon-revamps-app-to-go-beyond-the-shake-users-can-discover-restaurants-based-on-personal-filters-expert-content-144595495.html) |
| Dining history and optional social sharing | Dineline recorded visits, meals, and photos, with Facebook Timeline sharing. This was a later feature around the core discovery flow. [Dineline announcement](https://www.prnewswire.com/news-releases/urbanspoon-launches-dineline-feature-for-new-facebook-timeline-app-137632353.html) |
| Browsing without a mandatory login | Zomato explicitly contrasted its required login with Urbanspoon. [Migration announcement](https://www.zomato.com/blog/urbanspoon-to-zomato-d-day-2-of-4/) |

The App Store version history also documents ongoing improvements to filters, maps, nearby discovery, and shake results. The July 2014 update added the restaurant rating directly to shake results. [Developer version history](https://apps.apple.com/us/app/urbanspoon-restaurant-food-reviews/id284708449)

## What happened to it

Zomato announced the acquisition on January 12, 2015. On June 1, 2015, it announced the integrated product and migration of restaurant and user information. Shake-to-search and Guides were removed. This ended the independent Urbanspoon experience; an old store listing still being accessible does not establish a functioning service. [Official acquisition announcement](https://www.zomato.com/blog/it-might-seem-crazy-but/), [official migration announcement](https://www.zomato.com/blog/urbanspoon-to-zomato-d-day-2-of-4/)

## Design decisions for the first Spoonfed draft

These are recommendations derived from the research, not claims about Urbanspoon's implementation:

1. Make three reels and a prominent spin button the main action; keep physical shake optional.
2. Respect every locked filter. If none match, explain the empty result and let the user change a filter.
3. Show one clear suggestion with Save and another-spin actions, then let the user explore details.
4. Support browse and saved places without requiring an account for the prototype.
5. Avoid an immediate repeat when several matching places exist. The original sampling algorithm and weighting were not verified.
6. Use original branding, layout, and assets. The sources explain behavior; they do not supply reusable restaurant data or rights to Urbanspoon assets.

The current draft uses fictional Denver restaurants and sample approval figures. They are interface demonstrations, not verified venues, customer reviews, current opening hours, or live recommendations. A production data plan is in [the platform roadmap](platform-roadmap.md).
