from django import template
register = template.Library()

@register.filter
def map_attr(items, attr):
    """Get a list of values for a specific attribute from a list of dictionaries"""
    if not items:
        return []
    if isinstance(items[0], dict):
        return [item.get(attr, 0) for item in items]
    return [getattr(item, attr) for item in items]

@register.filter
def sum_total_value(holdings):
    """Sum the total_value field from a list of holdings"""
    if not holdings:
        return 0
    return sum(float(holding.get('total_value', 0)) for holding in holdings)

@register.filter
def count_nonzero_holdings(holdings):
    """Count holdings with non-zero quantity"""
    if not holdings:
        return 0
    return sum(1 for holding in holdings if float(holding.get('quantity', 0)) > 0)
