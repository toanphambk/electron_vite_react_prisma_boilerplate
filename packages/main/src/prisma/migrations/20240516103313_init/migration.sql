-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "excelFileBuffer" BLOB NOT NULL,
    "finishImport" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DataEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "robotName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "weldingPoint" TEXT NOT NULL,
    "deepLearningResult" TEXT,
    "visionProResult" TEXT,
    "overallResult" TEXT,
    CONSTRAINT "DataEntry_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "robotName" TEXT NOT NULL,
    "imageBuffer" BLOB NOT NULL,
    CONSTRAINT "Image_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordDir" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_fileName_key" ON "Record"("fileName");
