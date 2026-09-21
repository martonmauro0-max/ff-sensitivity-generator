def adjust_sensitivity(values, ram, processor, fps, refresh_rate, dpi):
    score = 0

    if fps and fps >= 90:
        score += 5
    elif fps and fps <= 60:
        score -= 3

    if refresh_rate and refresh_rate >= 120:
        score += 4
    elif refresh_rate and refresh_rate <= 60:
        score -= 2

    if ram:
        try:
            max_ram = max(int(x.strip()) for x in ram.replace("GB","").split("/"))
            if max_ram >= 8:
                score += 3
            elif max_ram <= 4:
                score -= 2
        except ValueError:
            pass

    if dpi:
        if dpi >= 480:
            score += 2
        elif dpi <= 420:
            score -= 1

    return {
        key: max(1, min(200, value + score))
        for key, value in values.items()
    }
