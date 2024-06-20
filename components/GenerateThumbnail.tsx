import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { GenerateThumbnailProps } from "@/types";
import { Loader } from "lucide-react";
import { Input } from "./ui/input";
import Image from "next/image";
import { useToast } from "./ui/use-toast";
import { useAction, useMutation } from "convex/react";
import { useUploadFiles } from "@xixixao/uploadstuff/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { generateUploadUrl } from "@/convex/files";

const GenerateThumbnail = ({
  setImage,
  setImageStorageId,
  image,
  imagePrompt,
  setImagePrompt,
}: GenerateThumbnailProps) => {
  const [isAiThumbnail, setIsAiThumbnail] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);
  const getImageUrl = useMutation(api.podcasts.getUrl);
  const imageRef = useRef<HTMLInputElement>(null);
  const handleGenerateThumbnail = useAction(api.openai.generateThumbnailAction);
  const { toast } = useToast();

  /**
   * 画像をアップロードする関数
   *
   * @param blob 画像のBlobオブジェクト
   * @param fileName 画像のファイル名
   */
  const handleImage = async (blob: Blob, fileName: string) => {
    setIsImageLoading(true);
    setImage("");

    try {
      // BlobオブジェクトからFileオブジェクトを作成する
      const file = new File([blob], fileName, { type: "image/png" });
      // ファイルをアップロードする
      const uploaded = await startUpload([file]);
      // アップロードされたファイルのストレージIDを取得する
      const storageId = (uploaded[0].response as any).storageId;

      // サムネイルのストレージIDを設定する
      setImageStorageId(storageId);

      // ファイルのURLを取得する
      const imageUrl = await getImageUrl({ storageId });
      // サムネイルのURLを設定する
      setImage(imageUrl!);
      // サムネイルの読み込み中フラグを下げる
      setIsImageLoading(false);
      toast({
        title: "イメージのアップロードに成功しました",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "イメージのアップロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  /**
   * AIでサムネイルを生成する関数
   */
  const generateImage = async () => {
    try {
      const response = await handleGenerateThumbnail({
        prompt: imagePrompt,
      });

      const blob = new Blob([response], { type: "image/png" });
      handleImage(blob, `image-${uuidv4()}.png`);
    } catch (error) {
      console.log(error);
      toast({
        title: "イメージの生成に失敗しました",
        variant: "destructive",
      });
    }
  };

  /**
   * 画像をアップロードする関数
   *
   * @param e ファイル選択イベント
   */
  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // イベントをキャンセルする
    e.preventDefault();

    try {
      // ファイルを取得する
      const files = e.target.files;

      if (!files) {
        return;
      }

      // 選択された最初のファイルを取得する
      const file = files[0];
      // ファイルをBlobオブジェクトに変換する
      const blob = await file
        .arrayBuffer()
        .then((buffer) => new Blob([buffer]));

      // 画像をアップロードする
      handleImage(blob, file.name);
    } catch (error) {
      // エラーが発生した場合、コンソールに出力し、トーストメッセージを表示する
      console.log(error);
      toast({
        title: "イメージのアップロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="generate_thumbnail">
        <Button
          type="button"
          variant="plain"
          onClick={() => setIsAiThumbnail(true)}
          className={cn("", {
            "bg-black-6": isAiThumbnail,
          })}
        >
          AIでイメージを生成
        </Button>
        <Button
          type="button"
          variant="plain"
          onClick={() => setIsAiThumbnail(false)}
          className={cn("", {
            "bg-black-6": !isAiThumbnail,
          })}
        >
          カスタムイメージを追加
        </Button>
      </div>
      {isAiThumbnail ? (
        <div className="flex flex-col gap-5">
          <div className="mt-5 flex flex-col text-white-1 gap-2.5">
            <Label className="text-16 font-bold text-white-1">
              AIでサムネイルを作成
            </Label>
            <Textarea
              className="input-class font-light focus-visible:ring-offset-orange-1"
              placeholder="Provide text to generate thumbnail"
              rows={5}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
            />
          </div>
          <div className="w-full max-w-[200px]">
            <Button
              type="submit"
              className="text-16 bg-orange-1 py-4 font-bold text-white-1"
              onClick={generateImage}
            >
              {isImageLoading ? (
                <>
                  生成中
                  <Loader size={20} className="animate-spin ml-2" />
                </>
              ) : (
                "生成"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="image_div" onClick={() => imageRef.current?.click()}>
          <Input
            type="file"
            className="hidden"
            ref={imageRef}
            onChange={(e) => {
              uploadImage(e);
            }}
          />
          {!isImageLoading ? (
            <Image
              src="/icons/upload-image.svg"
              width={40}
              height={40}
              alt="upload"
            />
          ) : (
            <div className="text-16 flex-center font-medium text-white-1">
              画像をアップロード中
              <Loader size={20} className="animate-spin ml-2" />
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-12 font-bold text-orange-1">
              カスタムイメージを追加
            </h2>
            <p className="text-12 font-normal text-gray-1">
              SVG, PNG , JPG, GIF (max 1080px x 1080px)
            </p>
          </div>
        </div>
      )}
      {image && (
        <div className="flex-center w-full">
          <Image
            src={image}
            width={200}
            height={200}
            className="mt-5"
            alt="thumbnail"
          />
        </div>
      )}
    </>
  );
};

export default GenerateThumbnail;
