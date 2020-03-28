export class IntersectionInfo {
  public faceId = 0;
  public subMeshId = 0;

  constructor(public bu: number | null, public bv: number | null, public distance: number) {}
}
