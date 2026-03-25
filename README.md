# Multimodal Deepfake Detection System (rPPG + FaceMesh)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python Version](https://img.shields.io/badge/python-3.10-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Code Style](https://img.shields.io/badge/code%20style-black-000000)
![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen)

---

## Executive Summary

This project implements an **industry-grade deepfake detection system** using a **multimodal dual-stream architecture** that combines:

- **rPPG (Remote Photoplethysmography)** → captures biological pulse signals from subtle skin color variations  
- **FaceMesh-based Geometric Analysis** → captures facial landmark dynamics and motion inconsistencies  

### Why this matters

Traditional deepfake detectors rely on **visual artifacts**, which modern generative models can easily eliminate.  
Our approach addresses this limitation by:

- Leveraging **biological signals** that are inherently difficult to synthesize
- Combining them with **structural facial dynamics**
- Producing a **robust, generalizable, and explainable detection system**

> This system is designed for **forensic verification, KYC pipelines, media authentication, and real-world deployment scenarios**.

---

## High-Level Architecture

```text
Raw Video Input
      │
      ▼
[Preprocessing Pipeline]
- Frame extraction
- Face detection & alignment
- Temporal windowing
      │
      ▼
[Dual Feature Extraction]
 ├── rPPG Stream (Biological)
 │     - ROI extraction (forehead, cheeks, chin)
 │     - Signal processing (CHROM / POS)
 │     - PPG map generation
 │
 └── FaceMesh Stream (Geometric)
       - Landmark extraction (MediaPipe)
       - Motion features (EAR, blink rate, lip sync)
       - Temporal sequence modeling
      │
      ▼
[Fusion Layer]
- Early / Late Fusion
- Feature concatenation
- MLP / Transformer head
      │
      ▼
[Classification Output]
- Real / Fake probability
- Confidence score
- Explainability (Grad-CAM / heatmaps)