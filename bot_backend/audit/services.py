def seo_audit(data):

    score = 100
    issues = []

    # --- Title ---
    title = data.get("title") or ""
    if not title:
        score -= 10
        issues.append("Missing title tag")
    elif len(title) < 10:
        score -= 10
        issues.append("Title too short")
    elif len(title) > 60:
        score -= 5
        issues.append("Title too long (over 60 chars)")

    # --- Meta Description ---
    description = data.get("description") or ""
    if not description:
        score -= 10
        issues.append("Missing meta description")
    elif len(description) < 50:
        score -= 10
        issues.append("Meta description too short")
    elif len(description) > 160:
        score -= 5
        issues.append("Meta description too long (over 160 chars)")

    # --- H1 ---
    h1 = data.get("h1") or []
    if len(h1) == 0:
        score -= 15
        issues.append("Missing H1 tag")
    elif len(h1) > 1:
        score -= 5
        issues.append("Multiple H1 tags (should have only one)")

    # --- H2 ---
    h2 = data.get("h2") or []
    if len(h2) < 2:
        score -= 10
        issues.append("Not enough H2 headings (less than 2)")

    # --- Word Count ---
    content = data.get("content") or ""
    word_count = len(content.split())
    if word_count < 300:
        score -= 10
        issues.append(f"Content too short ({word_count} words, minimum 300)")

    # --- Images without alt ---
    images_without_alt = data.get("images_without_alt") or 0
    if images_without_alt > 0:
        deduction = min(images_without_alt * 3, 15)  # max 15 point deduction
        score -= deduction
        issues.append(f"{images_without_alt} images missing alt text")

    # --- Broken links ---
    broken_links = data.get("broken_links") or 0
    if broken_links > 0:
        deduction = min(broken_links * 5, 20)  # max 20 point deduction
        score -= deduction
        issues.append(f"{broken_links} broken links found")

    # --- Internal links ---
    internal_links = data.get("internal_links") or []
    if len(internal_links) < 3:
        score -= 5
        issues.append("Too few internal links (less than 3)")

    return {
        "seo_score": max(0, score),  # never go below 0
        "issues": issues,
        "issues_count": len(issues),
        "meta_description": description,  # used by seo_analyzer.py
        "images_without_alt": images_without_alt,
        "broken_links": broken_links,
        "h1_count": len(h1),
        "h2_count": len(h2),
        "word_count": word_count,
        "internal_links": len(internal_links),
    }