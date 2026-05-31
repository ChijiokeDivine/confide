import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register a fallback font
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v94/6xK3dSBYKcSV-LCoeQqfX1RYOo3qNa7lqDY.ttf" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  responseMeta: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  question: {
    marginBottom: 15,
  },
  questionLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
  },
  questionValue: {
    fontSize: 12,
    color: "#111827",
  },
  signatureSection: {
    marginTop: 40,
    borderTop: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 20,
  },
  signatureLine: {
    marginTop: 30,
    borderBottom: 1,
    borderBottomColor: "#111827",
    width: "50%",
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
});

interface ResponsePDFProps {
  formTitle: string;
  formDescription?: string;
  response: {
    responseId: string;
    submittedAt: string;
    answers: Record<string, unknown>;
  };
  questions: Array<{ label: string; type: string }>;
}

export default function ResponsePDF({
  formTitle,
  formDescription,
  response,
  questions,
}: ResponsePDFProps) {
  const date = new Date(response.submittedAt);
  const formattedDate = date.toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{formTitle}</Text>
          {formDescription && (
            <Text style={styles.subtitle}>{formDescription}</Text>
          )}
        </View>

        <View style={styles.responseMeta}>
          <Text style={styles.subtitle}>
            Response submitted on {formattedDate}
          </Text>
        </View>

        {questions.map((q) => (
          <View key={q.label} style={styles.question}>
            <Text style={styles.questionLabel}>{q.label}</Text>
            <Text style={styles.questionValue}>
              {Array.isArray(response.answers[q.label])
                ? (response.answers[q.label] as string[]).join(", ")
                : String(response.answers[q.label] ?? "—")}
            </Text>
          </View>
        ))}

        <View style={styles.signatureSection}>
          <Text style={styles.subtitle}>Signature</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            Name / Signature
          </Text>
          <View style={[styles.signatureLine, { marginTop: 20 }]} />
          <Text style={styles.signatureLabel}>
            Date
          </Text>
        </View>
      </Page>
    </Document>
  );
}
