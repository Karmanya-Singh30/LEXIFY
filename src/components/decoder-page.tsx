"use client";

import { useState, DragEvent, useEffect, useRef, MouseEvent } from "react";
import {
  BookText,
  FileText,
  HelpCircle,
  Languages,
  Loader2,
  Sparkles,
  UploadCloud,
  Moon,
  Sun,
  History,
  FileImage,
  File,
  Volume2,
} from "lucide-react";
import { useTheme } from "next-themes";
import * as pdfjs from "pdfjs-dist";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

import { summarizeLegalDocument } from "@/ai/flows/ai-summarize-legal-document";
import { translateSummary } from "@/ai/flows/ai-translate-summary";
import { aiExplainSpecificClause } from "@/ai/flows/ai-explain-specific-clause";
import { aiExtractTextFromImage } from "@/ai/flows/ai-extract-text-from-image";
import { aiTextToSpeech } from "@/ai/flows/ai-text-to-speech";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type LoadingStates =
  | "summary"
  | "explanation"
  | "translation"
  | "image"
  | "pdf"
  | "tts-summary"
  | "tts-explanation"
  | "tts-translation"
  | null;

type RecentDocument = {
  fileName: string;
  documentText: string;
  file?: File;
};

type AudioPlayerState = {
  url: string;
  type: 'summary' | 'explanation' | 'translation';
} | null;

export function DecoderPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [documentText, setDocumentText] = useState("");
  const [summary, setSummary] = useState("");
  const [clause, setClause] = useState("");
  const [explanation, setExplanation] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [loading, setLoading] = useState<LoadingStates>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [fileName, setFileName] = useState("");
  const [recentlyAnalyzed, setRecentlyAnalyzed] = useState<RecentDocument[]>([]);
  const isHandlingClause = useRef(false);
  const [audioPlayer, setAudioPlayer] = useState<AudioPlayerState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (clause && isHandlingClause.current) {
      handleExplainClause();
      isHandlingClause.current = false;
    }
  }, [clause]);


  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    const fileType = file.type;
    const reader = new FileReader();

    if (fileType === "text/plain") {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDocumentText(text);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else if (fileType === "image/jpeg" || fileType === "image/png") {
      setLoading("image");
      setFileName(file.name);
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
          const result = await aiExtractTextFromImage({ imageDataUri: dataUri });
          setDocumentText(result.text);
        } catch (error) {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Text Extraction Failed",
            description: "Could not extract text from the image. Please try again.",
          });
          setFileName("");
        } finally {
          setLoading(null);
        }
      };
      reader.readAsDataURL(file);
    } else if (fileType === "application/pdf") {
      setLoading("pdf");
      setFileName(file.name);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((s: any) => s.str).join(" ");
        }
        setDocumentText(textContent);

      } catch (error) {
        console.error("Error parsing PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Processing Failed",
          description: "Could not extract text from the PDF. The file might be corrupted or protected.",
        });
        setFileName("");
      } finally {
        setLoading(null);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a .txt, .jpg, .png or .pdf file.",
      });
      return;
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSummarize = async () => {
    if (!documentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a document to analyze.",
      });
      return;
    }
    setLoading("summary");
    setSummary("");
    setExplanation("");
    setTranslatedSummary("");
    setClause("");
    setAudioPlayer(null);


    try {
      const result = await summarizeLegalDocument({ documentText });
      setSummary(result.summary);
      setActiveTab("summary");
      
      const newRecent: RecentDocument = { fileName: fileName || "Pasted Text", documentText };
      setRecentlyAnalyzed(prev => {
        const isDuplicate = prev.some(doc => doc.fileName === newRecent.fileName && doc.documentText === newRecent.documentText);
        if (isDuplicate) return prev;
        return [newRecent, ...prev].slice(0, 5);
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Summarization Failed",
        description: "Could not summarize the document. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleExplainClause = async () => {
    if (!documentText.trim() || !clause.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please ensure the document and the clause to explain are not empty.",
      });
      return;
    }
    setLoading("explanation");
    setExplanation("");
    setAudioPlayer(null);
    try {
      const result = await aiExplainSpecificClause({ documentText, clause });
      setExplanation(result.explanation);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Explanation Failed",
        description: "Could not explain the clause. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };
  

  const handleTranslate = async () => {
    if (!summary.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There is no summary to translate.",
      });
      return;
    }
    setLoading("translation");
    setTranslatedSummary("");
    try {
      const result = await translateSummary({
        text: summary,
        language: targetLanguage,
      });
      setTranslatedSummary(result.translatedText);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description: "Could not translate the summary. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleTextToSpeech = async (text: string, type: 'summary' | 'explanation' | 'translation') => {
    if (!text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There is no text to read aloud.',
      });
      return;
    }
    const loadingStateMap = {
      summary: 'tts-summary',
      explanation: 'tts-explanation',
      translation: 'tts-translation',
    };
    setLoading(loadingStateMap[type] as LoadingStates);
    setAudioPlayer(null);
    try {
      const result = await aiTextToSpeech({ text });
      setAudioPlayer({ url: result.audioDataUri, type });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Text-to-Speech Failed',
        description: 'Could not generate audio. Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };
  
  const handleRecentClick = (doc: RecentDocument) => {
    setDocumentText(doc.documentText);
    setFileName(doc.fileName);
    setSummary('');
    setExplanation('');
    setTranslatedSummary('');
    setClause('');
    setAudioPlayer(null);
    setActiveTab('summary');
    if (doc.file) {
      handleFileChange(doc.file);
    }
  };

  const handleTextSelection = (event: MouseEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selectedText && selectedText.trim().length > 0) {
      isHandlingClause.current = true;
      setClause(selectedText);
      setActiveTab('clause');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Sun className="h-5 w-5" />
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
        <Moon className="h-5 w-5" />
      </div>
      <div className="flex items-center justify-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          LEXIFY
        </h1>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="flex flex-col bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FileText className="text-primary" />
              Analyze Your Document
            </CardTitle>
            <CardDescription>
              Upload a .txt, .pdf, .jpg, or .png file, or paste/select content below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {loading === 'image' || loading === 'pdf' ? (
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed rounded-lg">
                  <Loader2 className="w-10 h-10 mb-4 text-muted-foreground animate-spin" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    {loading === 'image' ? 'Extracting text from image...' : 'Processing PDF...'}
                  </p>
                </div>
            ) : documentText ? (
              <div className="relative h-full min-h-[400px]">
                <Textarea
                  placeholder="e.g., This Lease Agreement is made and entered into on..."
                  className="h-full min-h-[400px] resize-none bg-background/50 font-code"
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  onMouseUp={handleTextSelection}
                />
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-muted/80 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TXT, PDF, JPG, or PNG
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button onClick={handleSummarize} disabled={loading === "summary" || loading === "image" || loading === "pdf"} className="shadow-lg shadow-primary/30">
                {loading === "summary" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                Analyze Document
              </Button>
               {documentText && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDocumentText("");
                    setFileName("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="clause">Clause Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline">Summary</CardTitle>
                <CardDescription>
                  A concise summary of the key points and obligations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading === "summary" ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span>Analyzing your document...</span>
                  </div>
                ) : summary ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 bg-background/50 text-foreground">
                      <p>{summary}</p>
                    </div>
                     <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTextToSpeech(summary, 'summary')}
                        disabled={loading === 'tts-summary'}
                      >
                        {loading === 'tts-summary' ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Volume2 />
                        )}
                        Read Aloud
                      </Button>
                    </div>

                    {audioPlayer?.type === 'summary' && (
                      <audio controls autoPlay src={audioPlayer.url} className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                    )}

                    <div className="space-y-4 rounded-md border p-4 bg-background/50">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Languages className="text-primary" />
                        Translate Summary
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={targetLanguage}
                          onValueChange={setTargetLanguage}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Marathi">Marathi</SelectItem>
                            <SelectItem value="Gujarati">Gujarati</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                            <SelectItem value="Sanskrit">Sanskrit</SelectItem>
                            <SelectItem value="Punjabi">Punjabi</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={handleTranslate}
                          disabled={loading === "translation"}
                        >
                          {loading === "translation" ? (
                            <Loader2 className="animate-spin" />
                          ) : null}
                          Translate
                        </Button>
                      </div>
                      {loading === "translation" && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Loader2 className="animate-spin" />
                          <span>Translating...</span>
                        </div>
                      )}
                      {translatedSummary && (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 bg-background/50 text-foreground">
                            <p>{translatedSummary}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTextToSpeech(translatedSummary, 'translation')}
                              disabled={loading === 'tts-translation'}
                            >
                              {loading === 'tts-translation' ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Volume2 />
                              )}
                              Read Aloud
                            </Button>
                          </div>
                          {audioPlayer?.type === 'translation' && (
                            <audio controls autoPlay src={audioPlayer.url} className="w-full">
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                    <Sparkles className="w-10 h-10 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Your document summary will appear here once you analyze a document.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clause">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <BookText className="text-primary" />
                  Clause Explanation
                </CardTitle>
                <CardDescription>
                  Select text in the document or paste a specific clause below to get an explanation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., The Tenant agrees to pay a security deposit of..."
                  value={clause}
                  onChange={(e) => setClause(e.target.value)}
                  className="min-h-[120px] bg-background/50"
                />
                {loading === "explanation" ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span>Explaining...</span>
                  </div>
                ) : explanation ? (
                  <>
                  <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 bg-background/50 text-foreground">
                    <p>{explanation}</p>
                  </div>
                   <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTextToSpeech(explanation, 'explanation')}
                        disabled={loading === 'tts-explanation'}
                      >
                        {loading === 'tts-explanation' ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Volume2 />
                        )}
                        Read Aloud
                      </Button>
                    </div>
                    {audioPlayer?.type === 'explanation' && (
                      <audio controls autoPlay src={audioPlayer.url} className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </>
                ) : null }
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleExplainClause}
                  disabled={loading === "explanation" || !documentText}
                >
                  {loading === "explanation" ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  Explain Clause
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {recentlyAnalyzed.length > 0 && (
        <div className="mt-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <History className="text-primary" />
                Recently Analyzed Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentlyAnalyzed.map((doc, index) => (
                  <li key={index}>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-left"
                      onClick={() => handleRecentClick(doc)}
                    >
                      {doc.fileName}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
