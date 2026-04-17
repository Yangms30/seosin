EXTRACT_SYSTEM = """당신은 뉴스 분석 어시스턴트입니다.
주어진 뉴스 기사들을 읽고 정확한 JSON 한 개만 출력하세요. 추가 설명, 머리말, 코드블록 표기 금지."""

EXTRACT_USER_TEMPLATE = """다음은 같은 이슈에 대한 뉴스 기사 모음입니다(카테고리: {category}).

{context}

아래 JSON 스키마에 맞춰 한 개의 JSON만 출력하세요:
{{
  "topic": "이슈의 한 줄 제목 (40자 이내)",
  "key_entities": ["핵심 인물/기관/지역", "..."],
  "core_fact": "가장 중요한 사실 한 문장",
  "sentiment": "positive | neutral | negative 중 하나",
  "importance_score": 1~10 사이 정수
}}"""
